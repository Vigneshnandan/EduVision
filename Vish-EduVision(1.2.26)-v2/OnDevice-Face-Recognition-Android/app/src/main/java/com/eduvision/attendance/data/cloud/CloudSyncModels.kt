/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

package com.eduvision.attendance.data.cloud

import com.google.gson.annotations.SerializedName

data class CloudAttendanceRecord(
    @SerializedName("student_id") val studentId: Long,
    @SerializedName("name") val name: String,
    @SerializedName("class_name") val className: String,
    @SerializedName("roll_number") val rollNumber: String,
    @SerializedName("date") val date: Long,
    @SerializedName("is_present") val isPresent: Boolean,
    @SerializedName("timestamp") val timestamp: Long,
    @SerializedName("is_manual") val isManual: Boolean = false,
    @SerializedName("marked_by") val markedBy: String? = null,
    @SerializedName("school_id") val schoolId: String? = null
)

/**
 * Metadata record for student details cloud sync.
 * Privacy & Security Guardrail: Under no circumstances should faceEmbedding,
 * biometric templates, or face crops ever be added to this model.
 */
data class CloudStudentDetailsRecord(
    @SerializedName("student_id") val studentId: String,
    @SerializedName("student_name") val studentName: String,
    @SerializedName("class_name") val className: String,
    @SerializedName("roll_number") val rollNumber: String,
    @SerializedName("school_id") val schoolId: String? = null
)

