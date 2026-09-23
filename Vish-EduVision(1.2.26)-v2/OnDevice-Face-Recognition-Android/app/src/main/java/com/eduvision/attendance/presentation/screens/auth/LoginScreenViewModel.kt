/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

package com.eduvision.attendance.presentation.screens.auth

import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.eduvision.attendance.data.auth.AuthRepository
import kotlinx.coroutines.launch
import org.koin.android.annotation.KoinViewModel

@KoinViewModel
class LoginScreenViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    val teacherLoginId = mutableStateOf("")
    val password = mutableStateOf("")
    val isPasswordVisible = mutableStateOf(false)
    val isLoading = mutableStateOf(false)
    val errorMessage = mutableStateOf<String?>(null)

    fun login(onSuccess: () -> Unit) {
        val id = teacherLoginId.value.trim()
        val pass = password.value

        if (id.isBlank() || pass.isBlank()) {
            errorMessage.value = "Please enter both Teacher ID and password."
            return
        }

        isLoading.value = true
        errorMessage.value = null

        viewModelScope.launch {
            val result = authRepository.loginTeacher(id, pass)
            isLoading.value = false
            result.onSuccess {
                onSuccess()
            }.onFailure { error ->
                errorMessage.value = error.localizedMessage ?: "Authentication failed. Check credentials or network."
            }
        }
    }
}
