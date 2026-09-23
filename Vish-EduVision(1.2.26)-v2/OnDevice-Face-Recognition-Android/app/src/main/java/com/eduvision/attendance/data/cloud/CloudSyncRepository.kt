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

    suspend fun syncAttendance(): Result<String> = withContext(Dispatchers.IO) {
        try {
            // 1. Get all attendance records (simplification: syncing everything or just for today/class?)
            // For now, let's sync ALL records to be safe, or we can filter.
            // Since the user said "sync the attendance data... so that i can create a dashboard", syncing all is safer.
            
            // We need a way to get ALL attendance records. 
            // attendanceUseCase doesn't seem to have getAll(). Let's check or use Box directly.
            // Assuming we can access the box via ObjectBoxStore if exposed or add a method.
            // Let's use the BoxStore directly since we're in data layer kinda (or injected).
            
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
                        schoolId = null
                    )
                } else {
                    null
                }
            }

            if (cloudRecords.isEmpty()) {
                return@withContext Result.success("No valid records to sync (students missing?)")
            }

            // 2. Push to cloud
            // Note: In Supabase, you usually need an API Key header. 
            // For simplicity, we are just calling the interface. 
            // The user might need to add interceptors later.
            api.pushAttendanceRecords(cloudRecords)
            
            Result.success("Synced ${cloudRecords.size} records successfully")
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }
}
