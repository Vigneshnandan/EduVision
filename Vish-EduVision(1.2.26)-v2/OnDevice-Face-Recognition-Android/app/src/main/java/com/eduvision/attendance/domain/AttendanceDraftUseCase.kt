/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

package com.eduvision.attendance.domain

import androidx.compose.runtime.mutableStateMapOf
import org.koin.core.annotation.Single

data class DraftEntry(
    val studentId: Long,
    val isPresent: Boolean,
    val isManual: Boolean = false,
    val markedByTeacherId: String = "",
    val correctionReason: String = ""
)

/**
 * In-memory staging holder for attendance recognition sessions.
 * Holds recognized faces during a session so nothing is written to persistent
 * AttendanceRecord entities until explicitly confirmed by the teacher.
 */
@Single
class AttendanceDraftUseCase {

    var studentClass: String = ""
        private set

    var attendanceDate: Long = 0L
        private set

    // Student ID -> DraftEntry
    val draftMap = mutableStateMapOf<Long, DraftEntry>()

    fun startSession(className: String, date: Long) {
        studentClass = className
        attendanceDate = date
        draftMap.clear()
    }

    /**
     * Records a student as recognized (present) in the in-memory draft session.
     * Returns true if newly marked present, false if already present in the draft.
     */
    fun markPresent(studentId: Long): Boolean {
        val current = draftMap[studentId]
        if (current?.isPresent == true) {
            return false
        }
        draftMap[studentId] = DraftEntry(
            studentId = studentId,
            isPresent = true,
            isManual = false
        )
        return true
    }

    /**
     * Toggles a student's presence state in the draft, marking it as a manual edit with an optional reason.
     */
    fun togglePresence(studentId: Long, teacherId: String = "", reason: String = "") {
        val current = draftMap[studentId]
        val currentPresent = current?.isPresent ?: false
        draftMap[studentId] = DraftEntry(
            studentId = studentId,
            isPresent = !currentPresent,
            isManual = true,
            markedByTeacherId = teacherId,
            correctionReason = reason
        )
    }

    fun getDraftEntry(studentId: Long): DraftEntry? = draftMap[studentId]

    fun isPresent(studentId: Long): Boolean = draftMap[studentId]?.isPresent == true

    fun clear() {
        draftMap.clear()
        studentClass = ""
        attendanceDate = 0L
    }
}
