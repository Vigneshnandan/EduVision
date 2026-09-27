/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

package com.eduvision.attendance.presentation.screens.add_face

import android.net.Uri
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import com.eduvision.attendance.data.auth.AuthRepository
import com.eduvision.attendance.data.cloud.CloudSyncRepository
import com.eduvision.attendance.domain.AppException
import com.eduvision.attendance.domain.ImageVectorUseCase
import com.eduvision.attendance.domain.PersonUseCase
import com.eduvision.attendance.presentation.components.setProgressDialogText
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.koin.android.annotation.KoinViewModel

@KoinViewModel
class AddFaceScreenViewModel(
    private val personUseCase: PersonUseCase,
    private val imageVectorUseCase: ImageVectorUseCase,
    private val cloudSyncRepository: CloudSyncRepository,
    private val authRepository: AuthRepository,
) : ViewModel() {
    val personNameState: MutableState<String> = mutableStateOf("")
    val studentClassState: MutableState<String> = mutableStateOf("")
    val rollNumberState: MutableState<String> = mutableStateOf("")
    val selectedImageURIs: MutableState<List<Uri>> = mutableStateOf(emptyList())

    val isProcessingImages: MutableState<Boolean> = mutableStateOf(false)
    val numImagesProcessed: MutableState<Int> = mutableIntStateOf(0)

    fun addImages() {
        isProcessingImages.value = true
        CoroutineScope(Dispatchers.Default).launch {
            val currentTeacher = authRepository.getCurrentTeacher()
            val schoolId = currentTeacher?.schoolId.orEmpty()

            val id =
                personUseCase.addPerson(
                    name = personNameState.value,
                    studentClass = studentClassState.value,
                    rollNumber = rollNumberState.value,
                    numImages = selectedImageURIs.value.size.toLong(),
                    schoolId = schoolId,
                    pendingStudentSync = false,
                )
            selectedImageURIs.value.forEach {
                imageVectorUseCase
                    .addImage(id, personNameState.value, it)
                    .onFailure {
                        val errorMessage = (it as AppException).errorCode.message
                        setProgressDialogText(errorMessage)
                    }.onSuccess {
                        numImagesProcessed.value += 1
                        setProgressDialogText("Processed ${numImagesProcessed.value} image(s)")
                    }
            }

            // Cloud push of metadata only (no biometric/face embeddings)
            val personRecord = personUseCase.getPerson(id)
            if (personRecord != null) {
                val pushResult = cloudSyncRepository.pushStudentDetails(personRecord)
                if (pushResult.isFailure) {
                    // Offline or network error: mark pendingStudentSync = true so it will retry later.
                    // Do NOT fail local registration. Face capture and storage remain fully functional offline.
                    personRecord.pendingStudentSync = true
                    personUseCase.updatePerson(personRecord)
                }
            }

            isProcessingImages.value = false
        }
    }
}

