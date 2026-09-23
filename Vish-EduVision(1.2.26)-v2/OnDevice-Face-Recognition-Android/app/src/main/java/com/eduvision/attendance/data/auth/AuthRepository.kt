/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

package com.eduvision.attendance.data.auth

import com.eduvision.attendance.data.ObjectBoxStore
import com.eduvision.attendance.data.TeacherRecord
import com.eduvision.attendance.data.TeacherRecord_
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import org.koin.core.annotation.Single
import retrofit2.Retrofit
import com.eduvision.attendance.BuildConfig
import retrofit2.converter.gson.GsonConverterFactory

@Single
class AuthRepository(
    private val encryptedSessionStore: EncryptedSessionStore
) {

    private val boxStore = ObjectBoxStore.store
    private val teacherBox = boxStore.boxFor(TeacherRecord::class.java)
    private val gson = Gson()

    // Sourced securely from local.properties via BuildConfig — never hardcoded in source control
    private val baseUrl = BuildConfig.SUPABASE_URL
    private val apiKey = BuildConfig.SUPABASE_ANON_KEY

    private val authService: AuthService by lazy {
        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()
                    .addHeader("apikey", apiKey)
                    .addHeader("Authorization", "Bearer $apiKey")
                    .addHeader("Content-Type", "application/json")
                    .build()
                chain.proceed(request)
            }
            .build()

        Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(AuthService::class.java)
    }

    // Cached schools list for offline fallback
    private var inMemoryCachedSchools: List<SchoolRecordDto> = emptyList()

    suspend fun getSchoolsWithCacheStatus(): Result<SchoolsResult> = withContext(Dispatchers.IO) {
        try {
            val schools = authService.getSchools()
            inMemoryCachedSchools = schools
            encryptedSessionStore.saveCachedSchools(gson.toJson(schools))
            Result.success(SchoolsResult(schools, isFromCache = false))
        } catch (e: Exception) {
            // Attempt to restore from EncryptedSessionStore cache or memory
            val cachedJson = encryptedSessionStore.getCachedSchools()
            if (!cachedJson.isNullOrBlank()) {
                try {
                    val listType = object : TypeToken<List<SchoolRecordDto>>() {}.type
                    val restored: List<SchoolRecordDto> = gson.fromJson(cachedJson, listType)
                    inMemoryCachedSchools = restored
                    return@withContext Result.success(SchoolsResult(restored, isFromCache = true))
                } catch (ignored: Exception) {
                    // Fall back to inMemoryCachedSchools if json parse fails
                }
            }
            if (inMemoryCachedSchools.isNotEmpty()) {
                Result.success(SchoolsResult(inMemoryCachedSchools, isFromCache = true))
            } else {
                Result.failure(e)
            }
        }
    }

    suspend fun getSchools(): Result<List<SchoolRecordDto>> = withContext(Dispatchers.IO) {
        getSchoolsWithCacheStatus().map { it.schools }
    }

    private fun normalizeEmail(loginId: String): String {
        val clean = loginId.trim().lowercase().replace("\\s+".toRegex(), "")
        return if (clean.contains("@")) clean else "$clean@eduvision.school"
    }

    suspend fun registerTeacher(
        teacherName: String,
        teacherLoginId: String,
        password: String,
        schoolId: String,
        schoolName: String
    ): Result<TeacherRecord> = withContext(Dispatchers.IO) {
        try {
            val email = normalizeEmail(teacherLoginId)
            val metadata = mapOf(
                "teacher_name" to teacherName,
                "teacher_login_id" to teacherLoginId,
                "school_id" to schoolId,
                "school_name" to schoolName
            )

            val authResponse = authService.signUp(
                SupabaseSignUpRequest(
                    email = email,
                    password = password,
                    data = metadata
                )
            )

            val remoteId = authResponse.user?.id ?: ""
            val token = authResponse.accessToken ?: ""

            // Record in public.teachers table
            try {
                authService.registerTeacherRecord(
                    mapOf(
                        "teacher_name" to teacherName,
                        "teacher_login_id" to teacherLoginId,
                        "school_id" to schoolId
                    )
                )
            } catch (ignored: Exception) {
                // Ignore if already written or trigger-managed
            }

            // Persist session securely in EncryptedSharedPreferences (AES256-GCM)
            encryptedSessionStore.saveSession(
                sessionToken = token,
                teacherRemoteId = remoteId,
                teacherName = teacherName,
                teacherLoginId = teacherLoginId,
                schoolId = schoolId,
                schoolName = schoolName
            )

            // Save to local ObjectBox session
            val teacher = TeacherRecord(
                teacherRemoteId = remoteId,
                teacherName = teacherName,
                teacherLoginId = teacherLoginId,
                schoolId = schoolId,
                schoolName = schoolName,
                sessionToken = token,
                lastLoginTime = System.currentTimeMillis()
            )
            teacherBox.removeAll()
            teacherBox.put(teacher)

            Result.success(teacher)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun loginTeacher(
        teacherLoginId: String,
        password: String
    ): Result<TeacherRecord> = withContext(Dispatchers.IO) {
        try {
            val email = normalizeEmail(teacherLoginId)
            val authResponse = authService.signIn(
                grantType = "password",
                request = SupabaseSignInRequest(
                    email = email,
                    password = password
                )
            )

            val user = authResponse.user
            val remoteId = user?.id ?: ""
            val token = authResponse.accessToken ?: ""
            val meta = user?.userMetadata

            val teacherName = meta?.get("teacher_name")?.toString() ?: teacherLoginId
            val schoolId = meta?.get("school_id")?.toString() ?: ""
            val schoolName = meta?.get("school_name")?.toString() ?: ""

            // Persist session securely in EncryptedSharedPreferences (AES256-GCM)
            encryptedSessionStore.saveSession(
                sessionToken = token,
                teacherRemoteId = remoteId,
                teacherName = teacherName,
                teacherLoginId = teacherLoginId,
                schoolId = schoolId,
                schoolName = schoolName
            )

            val teacher = TeacherRecord(
                teacherRemoteId = remoteId,
                teacherName = teacherName,
                teacherLoginId = teacherLoginId,
                schoolId = schoolId,
                schoolName = schoolName,
                sessionToken = token,
                lastLoginTime = System.currentTimeMillis()
            )
            teacherBox.removeAll()
            teacherBox.put(teacher)

            Result.success(teacher)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getCurrentTeacher(): TeacherRecord? {
        val fromBox = teacherBox.all.firstOrNull()
        if (fromBox != null) return fromBox

        // Restore to ObjectBox if encrypted session exists
        val token = encryptedSessionStore.getSessionToken()
        if (!token.isNullOrBlank()) {
            val teacher = TeacherRecord(
                teacherRemoteId = encryptedSessionStore.getTeacherRemoteId() ?: "",
                teacherName = encryptedSessionStore.getTeacherName() ?: "",
                teacherLoginId = encryptedSessionStore.getTeacherLoginId() ?: "",
                schoolId = encryptedSessionStore.getSchoolId() ?: "",
                schoolName = encryptedSessionStore.getSchoolName() ?: "",
                sessionToken = token,
                lastLoginTime = encryptedSessionStore.getLastLoginTime()
            )
            teacherBox.removeAll()
            teacherBox.put(teacher)
            return teacher
        }
        return null
    }

    fun hasValidSession(): Boolean {
        return encryptedSessionStore.hasValidSession()
    }

    fun logout() {
        encryptedSessionStore.clearSession()
        teacherBox.removeAll()
    }
}
