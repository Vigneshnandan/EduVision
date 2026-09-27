package com.eduvision.attendance.domain

import com.eduvision.attendance.data.AttendanceRecord
import com.eduvision.attendance.data.AttendanceRecord_
import com.eduvision.attendance.data.ObjectBoxStore
import com.eduvision.attendance.data.PersonRecord
import io.objectbox.Box
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.koin.core.annotation.Single
import java.util.Calendar

@Single
class AttendanceUseCase {

    private val attendanceBox: Box<AttendanceRecord> = ObjectBoxStore.store.boxFor(AttendanceRecord::class.java)

    suspend fun markAttendance(personId: Long, studentClass: String, date: Long = getTodayTimestamp()): Boolean {
        return withContext(Dispatchers.IO) {
            // Check if already marked for the specific date
            val existing = attendanceBox.query(
                AttendanceRecord_.studentId.equal(personId)
                    .and(AttendanceRecord_.date.equal(date))
            ).build().findFirst()

            if (existing != null) {
                return@withContext false // Already marked
            }

            val record = AttendanceRecord(
                studentId = personId,
                date = date,
                timestamp = System.currentTimeMillis(),
                isPresent = true,
                studentClass = studentClass
            )
            attendanceBox.put(record)
            true
        }
    }

    /**
     * Batch-commits an in-memory session draft to persistent AttendanceRecord entities.
     * Only entries with isPresent = true are persisted; if an entry was marked absent
     * (e.g. after a manual correction), any pre-existing record for that date is removed.
     */
    suspend fun commitDraft(
        studentClass: String,
        date: Long,
        draftEntries: Collection<DraftEntry>
    ): Int = withContext(Dispatchers.IO) {
        val recordsToPut = mutableListOf<AttendanceRecord>()
        for (draft in draftEntries) {
            val existing = attendanceBox.query(
                AttendanceRecord_.studentId.equal(draft.studentId)
                    .and(AttendanceRecord_.date.equal(date))
            ).build().findFirst()

            if (draft.isPresent) {
                if (existing != null) {
                    existing.isPresent = true
                    existing.isManual = draft.isManual
                    existing.markedByTeacherId = draft.markedByTeacherId
                    existing.timestamp = System.currentTimeMillis()
                    recordsToPut.add(existing)
                } else {
                    recordsToPut.add(
                        AttendanceRecord(
                            studentId = draft.studentId,
                            date = date,
                            timestamp = System.currentTimeMillis(),
                            isPresent = true,
                            studentClass = studentClass,
                            isManual = draft.isManual,
                            markedByTeacherId = draft.markedByTeacherId
                        )
                    )
                }
            } else {
                if (existing != null) {
                    attendanceBox.remove(existing)
                }
            }
        }
        if (recordsToPut.isNotEmpty()) {
            attendanceBox.put(recordsToPut)
        }
        recordsToPut.size
    }

    suspend fun getAttendanceForClass(studentClass: String, date: Long = getTodayTimestamp()): List<AttendanceRecord> {
        return withContext(Dispatchers.IO) {
            attendanceBox.query(
                AttendanceRecord_.studentClass.equal(studentClass)
                    .and(AttendanceRecord_.date.equal(date))
            ).build().find()
        }
    }

    suspend fun getAllAttendanceForDate(date: Long): List<AttendanceRecord> {
        return withContext(Dispatchers.IO) {
            attendanceBox.query(AttendanceRecord_.date.equal(date)).build().find()
        }
    }

    /**
     * Counts attendance records marked after [timestamp] — used to show a
     * "pending sync" count without any ObjectBox schema changes, by simply
     * comparing against the last-successful-sync time stored separately.
     */
    suspend fun countPendingSince(timestamp: Long): Long {
        return withContext(Dispatchers.IO) {
            attendanceBox.query(AttendanceRecord_.timestamp.greater(timestamp)).build().count()
        }
    }

    private fun getTodayTimestamp(): Long {
        val calendar = Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        return calendar.timeInMillis
    }
}
