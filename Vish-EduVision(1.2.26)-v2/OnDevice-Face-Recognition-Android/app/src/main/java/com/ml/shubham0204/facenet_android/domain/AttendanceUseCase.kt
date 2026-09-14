package com.ml.shubham0204.facenet_android.domain

import com.ml.shubham0204.facenet_android.data.AttendanceRecord
import com.ml.shubham0204.facenet_android.data.AttendanceRecord_
import com.ml.shubham0204.facenet_android.data.ObjectBoxStore
import com.ml.shubham0204.facenet_android.data.PersonRecord
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
