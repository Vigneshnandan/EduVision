/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

package com.eduvision.attendance.presentation.screens.result

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.eduvision.attendance.data.auth.AuthRepository
import com.eduvision.attendance.domain.AttendanceDraftUseCase
import com.eduvision.attendance.domain.AttendanceUseCase
import com.eduvision.attendance.domain.DraftEntry
import com.eduvision.attendance.domain.PersonUseCase
import com.eduvision.attendance.presentation.components.AppSearchField
import com.eduvision.attendance.presentation.components.CircularPercentRing
import com.eduvision.attendance.presentation.components.ResultItem
import com.eduvision.attendance.presentation.components.StatTile
import com.eduvision.attendance.presentation.components.StudentResult
import kotlinx.coroutines.launch
import org.koin.android.annotation.KoinViewModel
import org.koin.androidx.compose.koinViewModel

@KoinViewModel
class AttendanceResultViewModel(
    private val personUseCase: PersonUseCase,
    private val attendanceUseCase: AttendanceUseCase,
    private val authRepository: AuthRepository,
    val attendanceDraftUseCase: AttendanceDraftUseCase
) : ViewModel() {
    val results = mutableStateListOf<StudentResult>()
    val isCommitting = mutableStateOf(false)

    fun loadResults(studentClass: String, date: Long) {
        viewModelScope.launch {
            results.clear()
            val allPersons = personUseCase.getAllPersonsByClass(studentClass)

            // Prefer in-memory draft if it matches the current session class
            val hasActiveDraft = attendanceDraftUseCase.studentClass == studentClass && attendanceDraftUseCase.draftMap.isNotEmpty()

            val resultMap = if (hasActiveDraft) {
                allPersons.map { person ->
                    val draft = attendanceDraftUseCase.getDraftEntry(person.personID)
                    val isPresent = draft?.isPresent == true
                    val isManual = draft?.isManual == true
                    StudentResult(person, isPresent, isManual)
                }
            } else {
                val attendanceRecords = attendanceUseCase.getAttendanceForClass(studentClass, date)
                allPersons.map { person ->
                    val record = attendanceRecords.firstOrNull { it.studentId == person.personID }
                    StudentResult(person, record != null, record?.isManual == true)
                }
            }
            results.addAll(resultMap)
        }
    }

    fun toggleStudent(personId: Long) {
        val currentTeacher = authRepository.getCurrentTeacher()
        val teacherId = currentTeacher?.teacherLoginId ?: ""

        attendanceDraftUseCase.togglePresence(personId, teacherId)

        val index = results.indexOfFirst { it.person.personID == personId }
        if (index != -1) {
            val current = results[index]
            val updatedDraft = attendanceDraftUseCase.getDraftEntry(personId)
            results[index] = current.copy(
                isPresent = updatedDraft?.isPresent ?: !current.isPresent,
                isManual = updatedDraft?.isManual ?: true
            )
        }
    }

    fun confirmAttendance(studentClass: String, date: Long, onDone: () -> Unit) {
        viewModelScope.launch {
            isCommitting.value = true

            val currentTeacher = authRepository.getCurrentTeacher()
            val teacherId = currentTeacher?.teacherLoginId ?: ""

            // Ensure all items in results are present in draft before commit
            results.forEach { res ->
                val draft = attendanceDraftUseCase.getDraftEntry(res.person.personID)
                if (draft == null) {
                    if (res.isPresent) {
                        attendanceDraftUseCase.markPresent(res.person.personID)
                    }
                }
            }

            attendanceUseCase.commitDraft(
                studentClass = studentClass,
                date = date,
                draftEntries = attendanceDraftUseCase.draftMap.values
            )
            attendanceDraftUseCase.clear()

            isCommitting.value = false
            onDone()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AttendanceResultScreen(studentClass: String, date: Long, onNavigateHome: () -> Unit) {
    val viewModel: AttendanceResultViewModel = koinViewModel()

    LaunchedEffect(studentClass, date) {
        viewModel.loadResults(studentClass, date)
    }

    var searchQuery by remember { mutableStateOf("") }

    val results = viewModel.results
    val totalStudents = results.size
    val presentCount = results.count { it.isPresent }
    val absentCount = results.count { !it.isPresent }
    val attendancePercent = if (totalStudents > 0) (presentCount * 100 / totalStudents) else 0

    val filteredResults = results.filter {
        it.person.personName.contains(searchQuery, ignoreCase = true) ||
            it.person.rollNumber.contains(searchQuery, ignoreCase = true)
    }

    // Formatted Date
    val currentDate = remember(date) {
        java.text.SimpleDateFormat("dd MMM yyyy", java.util.Locale.getDefault()).format(java.util.Date(date))
    }

    val isCommitting by remember { viewModel.isCommitting }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Attendance Results",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.White
                    )
                },
                actions = {
                    Button(
                        onClick = { viewModel.confirmAttendance(studentClass, date, onNavigateHome) },
                        enabled = !isCommitting,
                        modifier = Modifier.padding(end = 8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color(0xFF29B6F6)),
                        shape = RoundedCornerShape(50),
                    ) {
                        if (isCommitting) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp,
                                color = Color(0xFF29B6F6)
                            )
                        } else {
                            Icon(Icons.Filled.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Confirm", fontWeight = FontWeight.Bold)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF29B6F6) // Sky Blue
                )
            )
        },
        containerColor = Color.White,
        bottomBar = {
            Surface(color = Color.White, shadowElevation = 8.dp) {
                Button(
                    onClick = { viewModel.confirmAttendance(studentClass, date, onNavigateHome) },
                    enabled = !isCommitting,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF29B6F6)),
                ) {
                    if (isCommitting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Saving...", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    } else {
                        Icon(Icons.Filled.CheckCircle, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Confirm Attendance", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            // Success banner
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F5E9)),
                shape = RoundedCornerShape(16.dp),
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .background(Color.White, RoundedCornerShape(22.dp)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            imageVector = Icons.Filled.CheckCircle,
                            contentDescription = null,
                            tint = Color(0xFF2E7D32),
                            modifier = Modifier.size(26.dp),
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Attendance Completed",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = Color(0xFF1B5E20),
                        )
                        Text(
                            text = "Class $studentClass • $currentDate",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF2E7D32),
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Great! Attendance has been successfully recorded.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF2E7D32),
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .background(Color.White, RoundedCornerShape(16.dp)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            imageVector = Icons.Filled.EmojiEvents,
                            contentDescription = null,
                            tint = Color(0xFF2E7D32),
                            modifier = Modifier.size(26.dp),
                        )
                    }
                }
            }

            // Attendance rate + stats card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, Color(0xFFE0E0E0)),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(96.dp)) {
                            CircularPercentRing(percent = attendancePercent, modifier = Modifier.fillMaxSize())
                        }
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .padding(start = 16.dp),
                        ) {
                            Icon(
                                imageVector = Icons.Filled.School,
                                contentDescription = null,
                                tint = Color(0xFF0288D1),
                                modifier = Modifier.size(16.dp),
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "\"Every present student is a step towards success\"",
                                style = MaterialTheme.typography.bodySmall.copy(fontStyle = FontStyle.Italic),
                                color = Color.Gray,
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        StatTile(
                            icon = Icons.Filled.Groups,
                            value = totalStudents.toString(),
                            label = "Total",
                            containerColor = Color(0xFFF5F5F5),
                            contentColor = Color.Black,
                            modifier = Modifier.weight(1f),
                        )
                        StatTile(
                            icon = Icons.Filled.CheckCircle,
                            value = presentCount.toString(),
                            label = "Present",
                            containerColor = Color(0xFFE8F5E9),
                            contentColor = Color(0xFF2E7D32),
                            modifier = Modifier.weight(1f),
                        )
                        StatTile(
                            icon = Icons.Filled.Cancel,
                            value = absentCount.toString(),
                            label = "Absent",
                            containerColor = Color(0xFFFFEBEE),
                            contentColor = Color(0xFFC62828),
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Student Attendance",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = Color.Black
                )
                Surface(
                    color = Color(0xFFE1F5FE),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Edit,
                            contentDescription = null,
                            tint = Color(0xFF0288D1),
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Tap to correct",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = Color(0xFF0288D1)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            AppSearchField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = "Search by name or roll number",
                modifier = Modifier.padding(horizontal = 16.dp),
            )

            Spacer(modifier = Modifier.height(8.dp))

            Column(modifier = Modifier.padding(bottom = 96.dp)) {
                filteredResults.forEach { result ->
                    ResultItem(
                        result = result,
                        onToggle = { viewModel.toggleStudent(result.person.personID) }
                    )
                }
            }
        }
    }
}
