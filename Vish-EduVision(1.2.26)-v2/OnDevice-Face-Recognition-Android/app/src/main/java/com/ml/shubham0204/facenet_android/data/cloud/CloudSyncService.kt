package com.ml.shubham0204.facenet_android.data.cloud

import retrofit2.http.Body
import retrofit2.http.POST

interface CloudSyncService {
    @POST("/rest/v1/attendance") // Replace with your actual endpoint path
    suspend fun pushAttendanceRecords(@Body records: List<CloudAttendanceRecord>)
}
