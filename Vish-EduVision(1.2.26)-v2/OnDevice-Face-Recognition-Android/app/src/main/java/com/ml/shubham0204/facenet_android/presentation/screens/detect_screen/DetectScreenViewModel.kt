package com.ml.shubham0204.facenet_android.presentation.screens.detect_screen

import androidx.camera.core.CameraSelector
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import com.ml.shubham0204.facenet_android.data.RecognitionMetrics
import com.ml.shubham0204.facenet_android.data.SettingsStore
import com.ml.shubham0204.facenet_android.domain.ImageVectorUseCase
import com.ml.shubham0204.facenet_android.domain.PersonUseCase
import org.koin.android.annotation.KoinViewModel

import androidx.lifecycle.viewModelScope
import com.ml.shubham0204.facenet_android.domain.AttendanceUseCase
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.launch

@KoinViewModel
class DetectScreenViewModel(
    val personUseCase: PersonUseCase,
    val imageVectorUseCase: ImageVectorUseCase,
    val attendanceUseCase: AttendanceUseCase,
    val settingsStore: SettingsStore
) : ViewModel() {
    var studentClass: String = ""
    var subsetPersonIDs: LongArray? = null
    
    private val _attendanceMessages = MutableSharedFlow<String>()
    val attendanceMessages: SharedFlow<String> = _attendanceMessages
    val classesState = mutableStateOf<List<String>>(emptyList())
    
    // Default to today
    var attendanceDate = mutableStateOf<Long>(getTodayTimestamp())

    fun loadClasses() {
        viewModelScope.launch {
            classesState.value = personUseCase.getAllClasses()
        }
    }

    fun setClass(className: String) {
        studentClass = className
        subsetPersonIDs = personUseCase.getPersonIDsByClass(className)
    }
    
    fun setDate(date: Long) {
        attendanceDate.value = date
    }

    fun markAttendance(personId: Long, name: String) {
        viewModelScope.launch {
            // Use the selected date
            if (attendanceUseCase.markAttendance(personId, studentClass, attendanceDate.value)) {
                _attendanceMessages.emit("Marked Present: $name")
            } else {
                _attendanceMessages.emit("Already Marked: $name")
            }
        }
    }
    
    private fun getTodayTimestamp(): Long {
        val calendar = java.util.Calendar.getInstance()
        calendar.set(java.util.Calendar.HOUR_OF_DAY, 0)
        calendar.set(java.util.Calendar.MINUTE, 0)
        calendar.set(java.util.Calendar.SECOND, 0)
        calendar.set(java.util.Calendar.MILLISECOND, 0)
        return calendar.timeInMillis
    }
    private val KEY_SETTINGS_CAMERA_FACING = "camera_facing"
    private val CAMERA_FACING_VALUE_BACK = "back"
    private val CAMERA_FACING_VALUE_FRONT = "front"

    val faceDetectionMetricsState = mutableStateOf<RecognitionMetrics?>(null)
    val cameraFacing = mutableIntStateOf(getCameraFacing())

    fun getNumPeople(): Long = personUseCase.getCount()

    private fun getCameraFacing(): Int {
        val cameraFacing = settingsStore.get(KEY_SETTINGS_CAMERA_FACING)
        return if (cameraFacing == CAMERA_FACING_VALUE_FRONT) {
            CameraSelector.LENS_FACING_FRONT
        } else {
            CameraSelector.LENS_FACING_BACK
        }
    }

    private fun saveCameraFacingSetting(cameraFacing: Int) {
        settingsStore.save(
            KEY_SETTINGS_CAMERA_FACING,
            if (cameraFacing == CameraSelector.LENS_FACING_FRONT) {
                CAMERA_FACING_VALUE_FRONT
            } else {
                CAMERA_FACING_VALUE_BACK
            }
        )
    }

    fun changeCameraFacing() {
        if (cameraFacing.intValue == CameraSelector.LENS_FACING_FRONT) {
            cameraFacing.intValue = CameraSelector.LENS_FACING_BACK
        } else {
            cameraFacing.intValue = CameraSelector.LENS_FACING_FRONT
        }
        saveCameraFacingSetting(cameraFacing.intValue)
    }
}
