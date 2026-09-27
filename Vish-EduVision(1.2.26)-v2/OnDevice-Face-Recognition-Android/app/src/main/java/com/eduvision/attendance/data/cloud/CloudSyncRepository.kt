/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

package com.eduvision.attendance.data.cloud

import com.eduvision.attendance.data.AttendanceRecord
import com.eduvision.attendance.data.PersonRecord
import com.eduvision.attendance.data.PersonRecord_
import com.eduvision.attendance.domain.AttendanceUseCase
import com.eduvision.attendance.domain.PersonUseCase
import com.eduvision.attendance.BuildConfig
import com.eduvision.attendance.data.auth.EncryptedSessionStore
import io.objectbox.Box
import io.objectbox.BoxStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.koin.core.annotation.Single
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import com.eduvision.attendance.data.ObjectBoxStore
import retrofit2.HttpException

@Single
class CloudSyncRepository(
    private val attendanceUseCase: AttendanceUseCase,
    private val personUseCase: PersonUseCase,
    private val encryptedSessionStore: EncryptedSessionStore
) {
    private val boxStore = ObjectBoxStore.store

    // Sourced securely from local.properties via BuildConfig — never hardcoded in source control
    private val BASE_URL = BuildConfig.SUPABASE_URL
    private val API_KEY = BuildConfig.SUPABASE_ANON_KEY

    private val api: CloudSyncService by lazy {
        val client = okhttp3.OkHttpClient.Builder()
            .addInterceptor { chain ->
                val sessionToken = encryptedSessionStore.getSessionToken()
                val authHeader = if (!sessionToken.isNullOrBlank()) {
                    "Bearer $sessionToken"
                } else {
                    "Bearer $API_KEY"
                }

                val request = chain.request().newBuilder()
                    .header("apikey", API_KEY)
                    .header("Authorization", authHeader)
                    .header("Content-Type", "application/json")
                    .build()

                val response = chain.proceed(request)

                // Only fallback retry on 401 Unauthorized if using user session
                if (response.code == 401 && !sessionToken.isNullOrBlank()) {
                    response.close()
                    val retryRequest = chain.request().newBuilder()
                        .header("apikey", API_KEY)
                        .header("Authorization", "Bearer $API_KEY")
                        .header("Content-Type", "application/json")
                        .build()
                    chain.proceed(retryRequest)
                } else {
                    response
                }
            }
            .build()

        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(CloudSyncService::class.java)
    }

    /**
     * Pushes student metadata to cloud.
     * Note: Only student details (personName, studentClass, rollNumber, schoolId) are pushed.
     * Raw face embeddings or biometric data are NEVER sent to the cloud.
     */
    suspend fun pushStudentDetails(person: PersonRecord): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val record = CloudStudentDetailsRecord(
                studentId = person.personID.toString(),
                studentName = person.personName,
                className = person.studentClass,
                rollNumber = person.rollNumber,
                schoolId = person.schoolId.ifEmpty { null }
            )
            api.pushStudentDetails(listOf(record))
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            val message = extractErrorMessage(e)
            Result.failure(Exception(message, e))
        }
    }

    /**
     * Flushes any pending student registrations queued while offline,
     * optionally filtered to a specific school_id.
     */
    suspend fun syncPendingStudents(targetSchoolId: String? = null): Result<Int> = withContext(Dispatchers.IO) {
        try {
            val allPending = personUseCase.getPendingSyncStudents()
            val pendingStudents = if (!targetSchoolId.isNullOrBlank()) {
                allPending.filter { it.schoolId == targetSchoolId }
            } else {
                allPending
            }
            if (pendingStudents.isEmpty()) {
                return@withContext Result.success(0)
            }

            val records = pendingStudents.map { person ->
                CloudStudentDetailsRecord(
                    studentId = person.personID.toString(),
                    studentName = person.personName,
                    className = person.studentClass,
                    rollNumber = person.rollNumber,
                    schoolId = person.schoolId.ifEmpty { null }
                )
            }

            api.pushStudentDetails(records)

            // Mark synced locally
            pendingStudents.forEach { person ->
                person.pendingStudentSync = false
                personUseCase.updatePerson(person)
            }

            Result.success(records.size)
        } catch (e: Exception) {
            e.printStackTrace()
            val message = extractErrorMessage(e)
            Result.failure(Exception(message, e))
        }
    }

    /**
     * Scopes attendance push strictly to the logged-in teacher's school_id,
     * preventing cross-school data leakage.
     */
    suspend fun syncAttendance(): Result<String> = withContext(Dispatchers.IO) {
        try {
            val currentSchoolId = encryptedSessionStore.getSchoolId()
            if (currentSchoolId.isNullOrBlank()) {
                return@withContext Result.failure(IllegalStateException("No authenticated teacher or school found in active session"))
            }

            // Also flush pending student registration records for this school
            val studentSyncResult = syncPendingStudents(currentSchoolId)
            if (studentSyncResult.isFailure) {
                // Non-fatal: log and proceed with attendance sync
                studentSyncResult.exceptionOrNull()?.printStackTrace()
            }

            val attendanceBox = boxStore.boxFor(AttendanceRecord::class.java)
            val personBox = boxStore.boxFor(PersonRecord::class.java)
            
            val allAttendance = attendanceBox.getAll()
            if (allAttendance.isEmpty()) {
                return@withContext Result.success("No records to sync")
            }

            // Scope push to the logged-in teacher's school_id only
            val cloudRecords = allAttendance.mapNotNull { attendance ->
                val person = personBox.get(attendance.studentId)
                if (person != null && (person.schoolId.isNullOrBlank() || person.schoolId == currentSchoolId)) {
                    val className = if (attendance.studentClass.isNotBlank()) {
                        attendance.studentClass
                    } else if (person.studentClass.isNotBlank()) {
                        person.studentClass
                    } else {
                        "Unassigned"
                    }

                    CloudAttendanceRecord(
                        studentId = person.personID,
                        name = person.personName.ifBlank { "Student" },
                        className = className,
                        rollNumber = person.rollNumber.ifBlank { "1" },
                        date = attendance.date,
                        isPresent = attendance.isPresent,
                        timestamp = if (attendance.timestamp > 0) attendance.timestamp else System.currentTimeMillis(),
                        isManual = attendance.isManual,
                        markedBy = attendance.markedByTeacherId.ifEmpty { null },
                        schoolId = currentSchoolId
                    )
                } else {
                    null
                }
            }

            if (cloudRecords.isEmpty()) {
                return@withContext Result.success("No records to sync for school $currentSchoolId")
            }

            api.pushAttendanceRecords(cloudRecords)
            
            Result.success("Synced ${cloudRecords.size} records successfully for school $currentSchoolId")
        } catch (e: Exception) {
            e.printStackTrace()
            val message = extractErrorMessage(e)
            Result.failure(Exception(message, e))
        }
    }

    private fun extractErrorMessage(e: Exception): String {
        return if (e is HttpException) {
            try {
                val errorBody = e.response()?.errorBody()?.string()
                if (!errorBody.isNullOrBlank()) {
                    "HTTP ${e.code()}: $errorBody"
                } else {
                    "HTTP ${e.code()}"
                }
            } catch (ignored: Exception) {
                "HTTP ${e.code()}"
            }
        } else {
            e.message ?: "Network error"
        }
    }
}
