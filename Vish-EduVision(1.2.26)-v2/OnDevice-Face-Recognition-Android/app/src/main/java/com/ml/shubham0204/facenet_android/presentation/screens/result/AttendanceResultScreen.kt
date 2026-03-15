package com.ml.shubham0204.facenet_android.presentation.screens.result

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ml.shubham0204.facenet_android.data.AttendanceRecord
import com.ml.shubham0204.facenet_android.data.PersonRecord
import com.ml.shubham0204.facenet_android.domain.AttendanceUseCase
import com.ml.shubham0204.facenet_android.domain.PersonUseCase
import com.ml.shubham0204.facenet_android.presentation.theme.FaceNetAndroidTheme
import kotlinx.coroutines.launch
import org.koin.android.annotation.KoinViewModel
import org.koin.androidx.compose.koinViewModel

@KoinViewModel
class AttendanceResultViewModel(
    private val personUseCase: PersonUseCase,
    private val attendanceUseCase: AttendanceUseCase
) : ViewModel() {
    val results = mutableStateListOf<StudentResult>()

    fun loadResults(studentClass: String, date: Long) {
        viewModelScope.launch {
            results.clear()
            val allPersons = personUseCase.getAllPersonsByClass(studentClass)
            // Use the passed date
            val attendanceRecords = attendanceUseCase.getAttendanceForClass(studentClass, date)
            
            val resultMap = allPersons.map { person ->
                val isPresent = attendanceRecords.any { it.studentId == person.personID }
                StudentResult(person, isPresent)
            }
            results.addAll(resultMap)
        }
    }
}

data class StudentResult(
    val person: PersonRecord,
    val isPresent: Boolean
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AttendanceResultScreen(studentClass: String, date: Long, onNavigateHome: () -> Unit) {
    val viewModel: AttendanceResultViewModel = koinViewModel()
    
    LaunchedEffect(studentClass, date) {
        viewModel.loadResults(studentClass, date)
    }

    val results = viewModel.results
    val totalStudents = results.size
    val presentCount = results.count { it.isPresent }
    val absentCount = results.count { !it.isPresent }
    
    // Formatted Date
    val currentDate = remember(date) { 
        java.text.SimpleDateFormat("dd MMM yyyy", java.util.Locale.getDefault()).format(java.util.Date(date)) 
    }

    FaceNetAndroidTheme {
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
                            onClick = onNavigateHome,
                            colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color(0xFF29B6F6))
                        ) {
                            Text("Done")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color(0xFF29B6F6) // Sky Blue
                    )
                )
            },
            containerColor = Color.White
        ) { padding ->
            Column(modifier = Modifier.padding(padding)) {
                // Summary Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFE1F5FE)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Class $studentClass",
                            style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                            color = Color.Black // Black text
                        )
                        Text(
                            text = currentDate,
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.Black // Black text
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            StatItem("Total", totalStudents.toString(), Color.Black)
                            StatItem("Present", presentCount.toString(), Color(0xFF2E7D32)) // Dark Green
                            StatItem("Absent", absentCount.toString(), Color(0xFFC62828)) // Dark Red
                        }
                    }
                }

                Text(
                    text = "Detailed List",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    color = Color.Black
                )

                LazyColumn(
                    contentPadding = PaddingValues(bottom = 16.dp)
                ) {
                    items(results) { result ->
                        ResultItem(result)
                    }
                }
            }
        }
    }
}

@Composable
fun StatItem(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = value, style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold), color = color)
        Text(text = label, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
    }
}

@Composable
fun ResultItem(result: StudentResult) {
    val containerColor = if (result.isPresent) Color(0xFFE8F5E9) else Color(0xFFFFEBEE)
    val contentColor = if (result.isPresent) Color(0xFF2E7D32) else Color(0xFFC62828)
    val icon = if (result.isPresent) Icons.Default.CheckCircle else Icons.Default.Cancel

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, contentColor.copy(alpha = 0.3f))
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(Color.White, RoundedCornerShape(20.dp)),
                contentAlignment = Alignment.Center
            ) {
                 Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = contentColor,
                    modifier = Modifier.size(24.dp)
                 )
            }
            
            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = result.person.personName, 
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = Color.Black
                )
                Text(
                    text = "Roll No: ${result.person.rollNumber}", 
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Black
                )
            }
            
            Box(
                modifier = Modifier
                    .background(contentColor, RoundedCornerShape(4.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = if (result.isPresent) "PRESENT" else "ABSENT",
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                    color = Color.White
                )
            }
        }
    }
}
