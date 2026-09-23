package com.eduvision.attendance.presentation.screens.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.eduvision.attendance.presentation.components.AppLogoLockup
import com.eduvision.attendance.presentation.components.CircularPercentRing
import com.eduvision.attendance.presentation.components.StatusPill
import org.koin.androidx.compose.koinViewModel

@Composable
fun EduVisionHomeScreen(
    onNavigateToRegistration: () -> Unit,
    onNavigateToAttendance: () -> Unit,
    onNavigateToStudentList: () -> Unit,
    onNavigateToLogs: () -> Unit
) {
    val viewModel: HomeScreenViewModel = koinViewModel()

    LaunchedEffect(Unit) {
        viewModel.refresh()
    }

    val isOnline by remember { viewModel.isOnline }
    val totalStudents by remember { viewModel.totalStudents }
    val presentToday by remember { viewModel.presentToday }
    val recentRegistrationActivity by remember { viewModel.recentRegistrationActivity }
    val recentAttendanceActivity by remember { viewModel.recentAttendanceActivity }

    val attendancePercent = if (totalStudents > 0) (presentToday * 100 / totalStudents) else 0

    // This mockup is a fixed light design — explicitly set light colors here
    // (like every other screen's Scaffold) instead of inheriting
    // MaterialTheme.colorScheme, so it renders the same regardless of the
    // device's system dark-mode setting.
    Scaffold(
        containerColor = Color.White,
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.White)
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
        ) {
            // Header: brand lockup + Online/Offline status
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                AppLogoLockup(modifier = Modifier.weight(1f))
                StatusPill(
                    text = if (isOnline) "Online" else "Offline",
                    icon = if (isOnline) Icons.Filled.Wifi else Icons.Filled.WifiOff,
                    containerColor = if (isOnline) Color(0xFFE8F5E9) else Color(0xFFFFEBEE),
                    contentColor = if (isOnline) Color(0xFF2E7D32) else Color(0xFFC62828),
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Greeting
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "Good Morning 👋",
                        style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                        color = Color.Black,
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "Smart attendance, made simple.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Gray,
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .background(Color(0xFFE1F5FE), RoundedCornerShape(16.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Filled.AccountBalance,
                        contentDescription = null,
                        tint = Color(0xFF0288D1),
                        modifier = Modifier.size(30.dp),
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Today's Attendance card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, Color(0xFFE0E0E0)),
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "Today's Attendance",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = Color.Black,
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "$presentToday/$totalStudents",
                            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                            color = Color(0xFF0288D1),
                        )
                        Text(
                            "Students Present",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray,
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        LinearProgressIndicator(
                            progress = { attendancePercent / 100f },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp)),
                            color = Color(0xFF29B6F6),
                            trackColor = Color(0xFFE0E0E0),
                        )
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    CircularPercentRing(percent = attendancePercent, modifier = Modifier.size(64.dp))
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Quick Actions
            Text(
                "Quick Actions",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = Color.Black,
            )
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                QuickActionCard(
                    icon = Icons.Filled.CameraAlt,
                    label = "Take Attendance",
                    iconContainerColor = Color(0xFFE1F5FE),
                    iconTint = Color(0xFF0288D1),
                    onClick = onNavigateToAttendance,
                    modifier = Modifier.weight(1f),
                )
                QuickActionCard(
                    icon = Icons.Filled.PersonAdd,
                    label = "Student Registration",
                    iconContainerColor = Color(0xFFE8F5E9),
                    iconTint = Color(0xFF2E7D32),
                    onClick = onNavigateToRegistration,
                    modifier = Modifier.weight(1f),
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                QuickActionCard(
                    icon = Icons.Filled.Groups,
                    label = "Student List",
                    iconContainerColor = Color(0xFFF3E5F5),
                    iconTint = Color(0xFF7B1FA2),
                    onClick = onNavigateToStudentList,
                    modifier = Modifier.weight(1f),
                )
                QuickActionCard(
                    icon = Icons.Filled.History,
                    label = "Attendance Logs",
                    iconContainerColor = Color(0xFFFFF3E0),
                    iconTint = Color(0xFFEF6C00),
                    onClick = onNavigateToLogs,
                    modifier = Modifier.weight(1f),
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Recent Activity
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, Color(0xFFE0E0E0)),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Recent Activity",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.Black,
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    if (recentRegistrationActivity == null && recentAttendanceActivity == null) {
                        Text(
                            "No recent activity yet.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray,
                        )
                    } else {
                        recentRegistrationActivity?.let {
                            RecentActivityRow(icon = Icons.Filled.PersonAdd, text = it)
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                        recentAttendanceActivity?.let {
                            RecentActivityRow(icon = Icons.Filled.CheckCircle, text = it)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun QuickActionCard(
    icon: ImageVector,
    label: String,
    iconContainerColor: Color,
    iconTint: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier
            .height(120.dp)
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE0E0E0)),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(iconContainerColor, RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(imageVector = icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(24.dp))
            }
            Text(
                label,
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                color = Color.Black,
            )
        }
    }
}

@Composable
private fun RecentActivityRow(icon: ImageVector, text: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .background(Color(0xFFE1F5FE), RoundedCornerShape(16.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = Color(0xFF0288D1),
                modifier = Modifier.size(16.dp),
            )
        }
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodySmall,
            color = Color.Black,
            modifier = Modifier.weight(1f),
        )
    }
}
