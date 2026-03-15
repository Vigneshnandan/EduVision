package com.ml.shubham0204.facenet_android.presentation.screens.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EduVisionHomeScreen(
    onNavigateToRegistration: () -> Unit,
    onNavigateToAttendance: () -> Unit,
    onNavigateToStudentList: () -> Unit,
    onNavigateToLogs: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "EDU VISION",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                        color = Color.White
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF29B6F6) // Sky Blue
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            HomeButton(text = "Student Registration", onClick = onNavigateToRegistration)
            Spacer(modifier = Modifier.height(16.dp))
            HomeButton(text = "Take Attendance", onClick = onNavigateToAttendance)
            Spacer(modifier = Modifier.height(16.dp))
            HomeButton(text = "Student List", onClick = onNavigateToStudentList)
            Spacer(modifier = Modifier.height(16.dp))
            HomeButton(text = "Attendance Logs", onClick = onNavigateToLogs)
        }
    }
}

@Composable
fun HomeButton(text: String, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp)
            .clickable { onClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(text, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.Black)
        }
    }
}
