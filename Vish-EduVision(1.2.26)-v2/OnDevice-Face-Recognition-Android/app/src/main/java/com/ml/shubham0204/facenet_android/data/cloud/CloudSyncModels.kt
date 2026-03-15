package com.ml.shubham0204.facenet_android.data.cloud

import com.google.gson.annotations.SerializedName

data class CloudAttendanceRecord(
    @SerializedName("student_id") val studentId: Long,
    @SerializedName("name") val name: String,
    @SerializedName("class_name") val className: String,
    @SerializedName("roll_number") val rollNumber: String,
    @SerializedName("date") val date: Long,
    @SerializedName("is_present") val isPresent: Boolean,
    @SerializedName("timestamp") val timestamp: Long
)
