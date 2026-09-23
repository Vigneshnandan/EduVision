/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

package com.eduvision.attendance.presentation.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.koin.androidx.compose.koinViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(
    onRegisterSuccess: () -> Unit,
    onNavigateBack: () -> Unit
) {
    val viewModel: RegisterScreenViewModel = koinViewModel()
    val focusManager = LocalFocusManager.current

    var name by remember { viewModel.teacherName }
    var loginId by remember { viewModel.teacherLoginId }
    var password by remember { viewModel.password }
    var confirmPassword by remember { viewModel.confirmPassword }
    var isPasswordVisible by remember { viewModel.isPasswordVisible }
    var isConfirmPasswordVisible by remember { viewModel.isConfirmPasswordVisible }

    val schoolsList by remember { viewModel.schoolsList }
    val selectedSchool by remember { viewModel.selectedSchool }
    val isSchoolsLoading by remember { viewModel.isSchoolsLoading }
    val isSchoolsFromCache by remember { viewModel.isSchoolsFromCache }
    val isSubmitting by remember { viewModel.isSubmitting }
    val errorMessage by remember { viewModel.errorMessage }

    var isDropdownExpanded by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = Color.White,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Teacher Registration",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.Black
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.Black
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.White)
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Join Your School 🏫",
                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                color = Color.Black,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "Register your profile and select your school from the directory",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Gray,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Offline Cache Notice
            if (isSchoolsFromCache) {
                Surface(
                    color = Color(0xFFFFF8E1),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Filled.WarningAmber,
                            contentDescription = null,
                            tint = Color(0xFFF57F17),
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Offline Mode: Showing cached schools list (may be stale). Connect to internet to refresh.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFF57F17)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Error Banner
            if (!errorMessage.isNullOrBlank()) {
                Surface(
                    color = Color(0xFFFFEBEE),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Filled.ErrorOutline,
                            contentDescription = null,
                            tint = Color(0xFFC62828),
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = errorMessage ?: "",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFC62828)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Teacher Name
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Teacher Full Name") },
                placeholder = { Text("e.g. John Doe") },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Filled.Person,
                        contentDescription = null,
                        tint = Color(0xFF0288D1)
                    )
                },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                keyboardActions = KeyboardActions(onNext = { focusManager.moveFocus(FocusDirection.Down) }),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Teacher Login ID
            OutlinedTextField(
                value = loginId,
                onValueChange = { loginId = it },
                label = { Text("Teacher ID or Staff ID") },
                placeholder = { Text("e.g. TCH101") },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Filled.Badge,
                        contentDescription = null,
                        tint = Color(0xFF0288D1)
                    )
                },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                keyboardActions = KeyboardActions(onNext = { focusManager.moveFocus(FocusDirection.Down) }),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(14.dp))

            // School Dropdown
            ExposedDropdownMenuBox(
                expanded = isDropdownExpanded,
                onExpandedChange = { isDropdownExpanded = !isDropdownExpanded },
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedTextField(
                    value = selectedSchool?.schoolName ?: if (isSchoolsLoading) "Loading schools..." else "Select School",
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("School") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Filled.AccountBalance,
                            contentDescription = null,
                            tint = Color(0xFF0288D1)
                        )
                    },
                    trailingIcon = {
                        if (isSchoolsLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = Color(0xFF0288D1)
                            )
                        } else {
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = isDropdownExpanded)
                        }
                    },
                    shape = RoundedCornerShape(14.dp),
                    colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor()
                )

                ExposedDropdownMenu(
                    expanded = isDropdownExpanded,
                    onDismissRequest = { isDropdownExpanded = false }
                ) {
                    if (schoolsList.isEmpty()) {
                        DropdownMenuItem(
                            text = { Text("No schools available. Connect to internet.") },
                            onClick = {
                                isDropdownExpanded = false
                                viewModel.loadSchools()
                            }
                        )
                    } else {
                        schoolsList.forEach { school ->
                            DropdownMenuItem(
                                text = {
                                    Column {
                                        Text(school.schoolName, fontWeight = FontWeight.Medium)
                                        school.schoolCode?.let {
                                            Text("Code: $it", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                                        }
                                    }
                                },
                                onClick = {
                                    viewModel.selectSchool(school)
                                    isDropdownExpanded = false
                                }
                            )
                        }
                    }
                }
            }

            if (schoolsList.isEmpty() && !isSchoolsLoading) {
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(
                        onClick = { viewModel.loadSchools() },
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Icon(Icons.Filled.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Retry loading schools", fontSize = 12.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Password
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password (min. 6 characters)") },
                placeholder = { Text("Enter password") },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Filled.Lock,
                        contentDescription = null,
                        tint = Color(0xFF0288D1)
                    )
                },
                trailingIcon = {
                    IconButton(onClick = { isPasswordVisible = !isPasswordVisible }) {
                        Icon(
                            imageVector = if (isPasswordVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff,
                            contentDescription = if (isPasswordVisible) "Hide password" else "Show password",
                            tint = Color.Gray
                        )
                    }
                },
                visualTransformation = if (isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Next),
                keyboardActions = KeyboardActions(onNext = { focusManager.moveFocus(FocusDirection.Down) }),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Confirm Password
            OutlinedTextField(
                value = confirmPassword,
                onValueChange = { confirmPassword = it },
                label = { Text("Confirm Password") },
                placeholder = { Text("Re-enter password") },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Filled.Lock,
                        contentDescription = null,
                        tint = Color(0xFF0288D1)
                    )
                },
                trailingIcon = {
                    IconButton(onClick = { isConfirmPasswordVisible = !isConfirmPasswordVisible }) {
                        Icon(
                            imageVector = if (isConfirmPasswordVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff,
                            contentDescription = if (isConfirmPasswordVisible) "Hide password" else "Show password",
                            tint = Color.Gray
                        )
                    }
                },
                visualTransformation = if (isConfirmPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(
                    onDone = {
                        focusManager.clearFocus()
                        if (!isSubmitting) viewModel.register(onRegisterSuccess)
                    }
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(28.dp))

            // Register Button
            Button(
                onClick = {
                    focusManager.clearFocus()
                    viewModel.register(onRegisterSuccess)
                },
                enabled = !isSubmitting,
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF0288D1),
                    contentColor = Color.White
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(22.dp),
                        color = Color.White,
                        strokeWidth = 2.5.dp
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("Registering account...", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                } else {
                    Text("Register & Sign In", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
