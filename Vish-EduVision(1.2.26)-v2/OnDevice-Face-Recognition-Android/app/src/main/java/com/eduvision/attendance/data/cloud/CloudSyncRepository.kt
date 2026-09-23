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
import io.objectbox.Box
import io.objectbox.BoxStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.koin.core.annotation.Single
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import com.eduvision.attendance.data.ObjectBoxStore

@Single
class CloudSyncRepository(
    private val attendanceUseCase: AttendanceUseCase,
    private val personUseCase: PersonUseCase
) {
    private val boxStore = ObjectBoxStore.store
    // Correct Supabase REST API URL derived from your project ID
    private val BASE_URL = "https://dvtsxuesvokpdcmtocjl.supabase.co" 
    private val API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2dHN4dWVzdm9rcGRjbXRvY2psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzI2OTAsImV4cCI6MjA4NTUwODY5MH0.eA4gLo10-Jttq6vFSvSPrXRfe8Q38g8UJ6v3xn7HoIM"

    private val api: CloudSyncService by lazy {
        val client = okhttp3.OkHttpClient.Builder()
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()
                    .addHeader("apikey", API_KEY)
                    .addHeader("Authorization", "Bearer $API_KEY")
                    .addHeader("Content-Type", "application/json")
                    .build()
                chain.proceed(request)
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
            Result.failure(e)
        }
    }

    /**
     * Flushes any pending student registrations queued while offline.
     */
    suspend fun syncPendingStudents(): Result<Int> = withContext(Dispatchers.IO) {
        try {
            val pendingStudents = personUseCase.getPendingSyncStudents()
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
            Result.failure(e)
        }
    }

    suspend fun syncAttendance(): Result<String> = withContext(Dispatchers.IO) {
        try {
            // Also flush pending student registration records if any
            syncPendingStudents()

            val attendanceBox = boxStore.boxFor(AttendanceRecord::class.java)
            val personBox = boxStore.boxFor(PersonRecord::class.java)
            
            val allAttendance = attendanceBox.getAll()
            if (allAttendance.isEmpty()) {
                return@withContext Result.success("No records to sync")
            }

            val cloudRecords = allAttendance.mapNotNull { attendance ->
                val person = personBox.get(attendance.studentId)
                if (person != null) {
                    CloudAttendanceRecord(
                        studentId = person.personID,
                        name = person.personName,
                        className = person.studentClass,
                        rollNumber = person.rollNumber,
                        date = attendance.date,
                        isPresent = attendance.isPresent,
                        timestamp = attendance.timestamp,
                        isManual = attendance.isManual,
                        markedBy = attendance.markedByTeacherId.ifEmpty { null },
                        schoolId = person.schoolId.ifEmpty { null }
                    )
                } else {
                    null
                }
            }

            if (cloudRecords.isEmpty()) {
                return@withContext Result.success("No valid records to sync (students missing?)")
            }

            api.pushAttendanceRecords(cloudRecords)
            
            Result.success("Synced ${cloudRecords.size} records successfully")
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }
}

