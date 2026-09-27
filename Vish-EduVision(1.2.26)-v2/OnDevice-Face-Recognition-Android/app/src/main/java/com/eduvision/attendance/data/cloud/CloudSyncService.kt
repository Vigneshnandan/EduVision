/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

package com.eduvision.attendance.data.cloud

import retrofit2.http.Body
import retrofit2.http.Headers
import retrofit2.http.POST

interface CloudSyncService {
    @POST("/rest/v1/attendance")
    suspend fun pushAttendanceRecords(@Body records: List<CloudAttendanceRecord>)

    @Headers("Prefer: resolution=merge-duplicates")
    @POST("/rest/v1/student_details")
    suspend fun pushStudentDetails(@Body details: List<CloudStudentDetailsRecord>)
}

