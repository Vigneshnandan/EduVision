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
import com.eduvision.attendance.data.auth.SchoolRecordDto
import kotlinx.coroutines.launch
import org.koin.android.annotation.KoinViewModel

@KoinViewModel
class RegisterScreenViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    val teacherName = mutableStateOf("")
    val teacherLoginId = mutableStateOf("")
    val password = mutableStateOf("")
    val confirmPassword = mutableStateOf("")
    val isPasswordVisible = mutableStateOf(false)
    val isConfirmPasswordVisible = mutableStateOf(false)

    val schoolsList = mutableStateOf<List<SchoolRecordDto>>(emptyList())
    val selectedSchool = mutableStateOf<SchoolRecordDto?>(null)
    val isSchoolsLoading = mutableStateOf(false)
    val isSchoolsFromCache = mutableStateOf(false)

    val isSubmitting = mutableStateOf(false)
    val errorMessage = mutableStateOf<String?>(null)

    init {
        loadSchools()
    }

    fun loadSchools() {
        isSchoolsLoading.value = true
        errorMessage.value = null
        viewModelScope.launch {
            val result = authRepository.getSchoolsWithCacheStatus()
            isSchoolsLoading.value = false
            result.onSuccess { schoolsResult ->
                schoolsList.value = schoolsResult.schools
                isSchoolsFromCache.value = schoolsResult.isFromCache
                if (schoolsResult.schools.isNotEmpty() && selectedSchool.value == null) {
                    selectedSchool.value = schoolsResult.schools.first()
                }
            }.onFailure { err ->
                errorMessage.value = "Failed to load schools: ${err.localizedMessage ?: "Network error"}"
            }
        }
    }

    fun selectSchool(school: SchoolRecordDto) {
        selectedSchool.value = school
    }

    fun register(onSuccess: () -> Unit) {
        val name = teacherName.value.trim()
        val loginId = teacherLoginId.value.trim()
        val pass = password.value
        val confirmPass = confirmPassword.value
        val school = selectedSchool.value

        if (name.isBlank()) {
            errorMessage.value = "Please enter your full name."
            return
        }
        if (loginId.isBlank()) {
            errorMessage.value = "Please enter a Teacher ID."
            return
        }
        if (school == null) {
            errorMessage.value = "Please select your school from the dropdown."
            return
        }
        if (pass.length < 6) {
            errorMessage.value = "Password must be at least 6 characters."
            return
        }
        if (pass != confirmPass) {
            errorMessage.value = "Passwords do not match."
            return
        }

        isSubmitting.value = true
        errorMessage.value = null

        viewModelScope.launch {
            val result = authRepository.registerTeacher(
                teacherName = name,
                teacherLoginId = loginId,
                password = pass,
                schoolId = school.schoolId,
                schoolName = school.schoolName
            )
            isSubmitting.value = false
            result.onSuccess {
                onSuccess()
            }.onFailure { err ->
                errorMessage.value = err.localizedMessage ?: "Registration failed. Check network connectivity."
            }
        }
    }
}
