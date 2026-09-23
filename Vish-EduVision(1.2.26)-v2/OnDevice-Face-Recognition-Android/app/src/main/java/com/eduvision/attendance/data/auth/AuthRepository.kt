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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import org.koin.core.annotation.Single
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

@Single
class AuthRepository {

    private val boxStore = ObjectBoxStore.store
    private val teacherBox = boxStore.boxFor(TeacherRecord::class.java)

    // Supabase project endpoints - will be moved to BuildConfig in Phase 7 hardening
    private val baseUrl = "https://dvtsxuesvokpdcmtocjl.supabase.co"
    private val apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2dHN4dWVzdm9rcGRjbXRvY2psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzI2OTAsImV4cCI6MjA4NTUwODY5MH0.eA4gLo10-Jttq6vFSvSPrXRfe8Q38g8UJ6v3xn7HoIM"

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
    private var cachedSchools: List<SchoolRecordDto> = emptyList()

    suspend fun getSchools(): Result<List<SchoolRecordDto>> = withContext(Dispatchers.IO) {
        try {
            val schools = authService.getSchools()
            cachedSchools = schools
            Result.success(schools)
        } catch (e: Exception) {
            if (cachedSchools.isNotEmpty()) {
                Result.success(cachedSchools)
            } else {
                Result.failure(e)
            }
        }
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
        return teacherBox.all.firstOrNull()
    }

    fun hasValidSession(): Boolean {
        val teacher = getCurrentTeacher()
        return teacher != null && teacher.sessionToken.isNotEmpty()
    }

    fun logout() {
        teacherBox.removeAll()
    }
}
