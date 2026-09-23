/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

package com.eduvision.attendance.data.auth

import com.google.gson.annotations.SerializedName

data class SchoolRecordDto(
    @SerializedName("school_id") val schoolId: String,
    @SerializedName("school_name") val schoolName: String,
    @SerializedName("school_code") val schoolCode: String? = null,
    @SerializedName("address") val address: String? = null
)

data class SupabaseSignUpRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String,
    @SerializedName("data") val data: Map<String, String>
)

data class SupabaseSignInRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class SupabaseAuthResponse(
    @SerializedName("access_token") val accessToken: String? = null,
    @SerializedName("token_type") val tokenType: String? = null,
    @SerializedName("expires_in") val expiresIn: Long? = null,
    @SerializedName("refresh_token") val refreshToken: String? = null,
    @SerializedName("user") val user: SupabaseUser? = null
)

data class SupabaseUser(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String? = null,
    @SerializedName("user_metadata") val userMetadata: Map<String, Any>? = null
)
