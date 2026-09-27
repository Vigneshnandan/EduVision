/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

package com.eduvision.attendance.data.auth

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface AuthService {

    @GET("/rest/v1/schools")
    suspend fun getSchools(
        @Query("select") select: String = "school_id,school_name,school_code,address"
    ): List<SchoolRecordDto>

    @POST("/auth/v1/signup")
    suspend fun signUp(
        @Body request: SupabaseSignUpRequest
    ): SupabaseAuthResponse

    @POST("/auth/v1/token")
    suspend fun signIn(
        @Query("grant_type") grantType: String = "password",
        @Body request: SupabaseSignInRequest
    ): SupabaseAuthResponse

    @POST("/rest/v1/teachers")
    suspend fun registerTeacherRecord(
        @retrofit2.http.Header("Authorization") authHeader: String? = null,
        @Body teacherRecord: Map<String, String>
    )
}
