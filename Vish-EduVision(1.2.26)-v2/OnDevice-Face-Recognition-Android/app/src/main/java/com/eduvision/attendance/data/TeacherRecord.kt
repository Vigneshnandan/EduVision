/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

package com.eduvision.attendance.data

import io.objectbox.annotation.Entity
import io.objectbox.annotation.Id
import io.objectbox.annotation.Index

@Entity
data class TeacherRecord(
    @Id var teacherID: Long = 0,
    @Index var teacherRemoteId: String = "", // id assigned by Supabase on registration
    var teacherName: String = "",
    var teacherLoginId: String = "",         // "Teacher ID" from the sketch
    var schoolId: String = "",               // FK to the school selected at registration
    var schoolName: String = "",             // denormalized for offline display
    var sessionToken: String = "",           // opaque token/hash, not the raw password
    var lastLoginTime: Long = 0,
)
