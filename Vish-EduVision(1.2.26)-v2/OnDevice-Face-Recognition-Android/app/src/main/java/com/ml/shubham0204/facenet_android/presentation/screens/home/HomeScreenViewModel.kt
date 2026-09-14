package com.ml.shubham0204.facenet_android.presentation.screens.home

import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ml.shubham0204.facenet_android.data.ConnectivityChecker
import com.ml.shubham0204.facenet_android.domain.AttendanceUseCase
import com.ml.shubham0204.facenet_android.domain.PersonUseCase
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import org.koin.android.annotation.KoinViewModel
import java.util.Calendar

@KoinViewModel
class HomeScreenViewModel(
    private val personUseCase: PersonUseCase,
    private val attendanceUseCase: AttendanceUseCase,
    private val connectivityChecker: ConnectivityChecker,
) : ViewModel() {
    val isOnline = mutableStateOf(true)
    val totalStudents = mutableIntStateOf(0)
    val presentToday = mutableIntStateOf(0)
    val recentRegistrationActivity = mutableStateOf<String?>(null)
    val recentAttendanceActivity = mutableStateOf<String?>(null)

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            isOnline.value = connectivityChecker.isOnline()

            totalStudents.value = personUseCase.getCount().toInt()

            val allPersons = personUseCase.getAll().first()
            val latestPerson = allPersons.maxByOrNull { it.addTime }
            recentRegistrationActivity.value = latestPerson?.let {
                "${it.personName} was registered to Class ${it.studentClass}"
            }

            val todaysAttendance = attendanceUseCase.getAllAttendanceForDate(getTodayTimestamp())
            presentToday.value = todaysAttendance.count { it.isPresent }

            val latestAttendanceGroup = todaysAttendance
                .groupBy { it.studentClass }
                .maxByOrNull { (_, records) -> records.maxOf { it.timestamp } }
            recentAttendanceActivity.value = latestAttendanceGroup?.let { (className, records) ->
                "Attendance marked for Class $className (${records.size} students)"
            }
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
