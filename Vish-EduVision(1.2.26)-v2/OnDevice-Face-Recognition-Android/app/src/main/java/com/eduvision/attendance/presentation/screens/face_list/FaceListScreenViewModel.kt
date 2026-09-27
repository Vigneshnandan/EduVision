package com.eduvision.attendance.presentation.screens.face_list

import androidx.lifecycle.ViewModel
import com.eduvision.attendance.domain.ImageVectorUseCase
import com.eduvision.attendance.domain.PersonUseCase
import org.koin.android.annotation.KoinViewModel

@KoinViewModel
class FaceListScreenViewModel(
    val imageVectorUseCase: Lazy<ImageVectorUseCase>,
    val personUseCase: PersonUseCase,
) : ViewModel() {
    val personFlow = personUseCase.getAll()

    // Remove the person from `PersonRecord`
    // and all associated face embeddings from `FaceImageRecord`
    fun removeFace(id: Long) {
        personUseCase.removePerson(id)
        imageVectorUseCase.value.removeImages(id)
    }
}
