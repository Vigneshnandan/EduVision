package com.ml.shubham0204.facenet_android.presentation.screens.log

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ml.shubham0204.facenet_android.data.PersonRecord
import com.ml.shubham0204.facenet_android.domain.AttendanceUseCase
import com.ml.shubham0204.facenet_android.domain.PersonUseCase
import com.ml.shubham0204.facenet_android.presentation.theme.FaceNetAndroidTheme
import kotlinx.coroutines.launch
import org.koin.android.annotation.KoinViewModel
import org.koin.androidx.compose.koinViewModel
import java.util.Date

import com.ml.shubham0204.facenet_android.data.cloud.CloudSyncRepository
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

@KoinViewModel
class AttendanceLogViewModel(
    private val personUseCase: PersonUseCase,
    private val attendanceUseCase: AttendanceUseCase,
    private val cloudSyncRepository: CloudSyncRepository
) : ViewModel() {
    val classesState = mutableStateOf<List<String>>(emptyList())
    val results = mutableStateListOf<StudentResult>()
    
    // UI Events
    private val _syncMessage = MutableSharedFlow<String>()
    val syncMessage = _syncMessage.asSharedFlow()

    fun syncAttendance() {
        viewModelScope.launch {
            _syncMessage.emit("Starting Sync...")
            val result = cloudSyncRepository.syncAttendance()
            result.onSuccess { message ->
                _syncMessage.emit("Sync Success: $message")
            }.onFailure { e ->
                _syncMessage.emit("Sync Failed: ${e.message}")
            }
        }
    }
    
    // Filters
    val selectedClass = mutableStateOf("")
    var selectedDate = mutableStateOf<Long>(getTodayTimestamp())

    fun loadClasses() {
        viewModelScope.launch {
            classesState.value = personUseCase.getAllClasses()
        }
    }

    fun loadResults() {
        if (selectedClass.value.isEmpty()) return
        
        viewModelScope.launch {
            results.clear()
            val allPersons = personUseCase.getAllPersonsByClass(selectedClass.value)
            val attendanceRecords = attendanceUseCase.getAttendanceForClass(selectedClass.value, selectedDate.value)
            
            val resultMap = allPersons.map { person ->
                val isPresent = attendanceRecords.any { it.studentId == person.personID }
                StudentResult(person, isPresent)
            }
            results.addAll(resultMap)
        }
    }
    
    fun setDate(date: Long) {
        selectedDate.value = date
        loadResults()
    }
    
    fun setClass(className: String) {
        selectedClass.value = className
        loadResults()
    }
    
    private fun getTodayTimestamp(): Long {
        val calendar = java.util.Calendar.getInstance()
        calendar.set(java.util.Calendar.HOUR_OF_DAY, 0)
        calendar.set(java.util.Calendar.MINUTE, 0)
        calendar.set(java.util.Calendar.SECOND, 0)
        calendar.set(java.util.Calendar.MILLISECOND, 0)
        return calendar.timeInMillis
    }
}

data class StudentResult(
    val person: PersonRecord,
    val isPresent: Boolean
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AttendanceLogScreen(onNavigateBack: () -> Unit) {
    val viewModel: AttendanceLogViewModel = koinViewModel()
    
    // Load Classes
    LaunchedEffect(Unit) {
        viewModel.loadClasses()
    }

    val context = androidx.compose.ui.platform.LocalContext.current
    LaunchedEffect(Unit) {
        viewModel.syncMessage.collect { message ->
            android.widget.Toast.makeText(context, message, android.widget.Toast.LENGTH_SHORT).show()
        }
    }

    val classes by remember { viewModel.classesState }
    val results = viewModel.results
    var expanded by remember { mutableStateOf(false) }
    
    // Date Picker State
    val dateState by remember { viewModel.selectedDate }
    val datePickerState = rememberDatePickerState(initialSelectedDateMillis = dateState)
    var showDatePicker by remember { mutableStateOf(false) }

    val currentDate = remember(dateState) { 
        java.text.SimpleDateFormat("dd MMM yyyy", java.util.Locale.getDefault()).format(Date(dateState)) 
    }
    
    if (showDatePicker) {
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    datePickerState.selectedDateMillis?.let { viewModel.setDate(it) }
                    showDatePicker = false
                }) {
                    Text("OK", color = Color(0xFF29B6F6))
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Cancel", color = Color.Red)
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    FaceNetAndroidTheme {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { 
                        Text(
                            "Attendance Logs", 
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = Color.White
                        ) 
                    },
                    navigationIcon = {
                        IconButton(onClick = onNavigateBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color(0xFF29B6F6)
                    ),
                    actions = {
                        IconButton(onClick = { viewModel.syncAttendance() }) {
                            Icon(Icons.Default.CloudUpload, contentDescription = "Sync", tint = Color.White)
                        }
                    }
                )
            },
            containerColor = Color.White
        ) { padding ->
            Column(modifier = Modifier.padding(padding)) {
                
                // Filters Card
                Card(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, Color.LightGray)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Filters", style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold), color = Color.Black)
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        // Date Picker
                         Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = currentDate,
                                onValueChange = {},
                                label = { Text("Date") },
                                readOnly = true,
                                modifier = Modifier.fillMaxWidth(),
                                leadingIcon = { Icon(Icons.Default.DateRange, null, tint = Color.Black) },
                                shape = RoundedCornerShape(12.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedTextColor = Color.Black,
                                    unfocusedTextColor = Color.Black,
                                    disabledTextColor = Color.Black,
                                    disabledLabelColor = Color.Black,
                                    disabledBorderColor = Color.Gray,
                                    disabledLeadingIconColor = Color.Black
                                ),
                                enabled = false
                            )
                            Box(
                                modifier = Modifier
                                    .matchParentSize()
                                    .clickable { showDatePicker = true }
                            )
                        }
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        // Class Dropdown
                        ExposedDropdownMenuBox(
                            expanded = expanded,
                            onExpandedChange = { expanded = !expanded },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            OutlinedTextField(
                                value = viewModel.selectedClass.value,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Select Class") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                                leadingIcon = { Icon(Icons.Default.Class, null) },
                                modifier = Modifier.menuAnchor().fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedTextColor = Color.Black,
                                    unfocusedTextColor = Color.Black
                                )
                            )
                            ExposedDropdownMenu(
                                expanded = expanded,
                                onDismissRequest = { expanded = false },
                                modifier = Modifier.background(Color.White)
                            ) {
                                if (classes.isEmpty()) {
                                    DropdownMenuItem(
                                        text = { Text("No classes found", color = Color.Black) },
                                        onClick = { expanded = false }
                                    )
                                } else {
                                    classes.forEach { classItem ->
                                        DropdownMenuItem(
                                            text = { Text(classItem, color = Color.Black) },
                                            onClick = {
                                                viewModel.setClass(classItem)
                                                expanded = false
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Stats and List
                if (viewModel.selectedClass.value.isNotEmpty()) {
                    val totalStudents = results.size
                    val presentCount = results.count { it.isPresent }
                    val absentCount = results.count { !it.isPresent }

                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        StatItem("Total", totalStudents.toString(), Color.Black)
                        StatItem("Present", presentCount.toString(), Color(0xFF2E7D32)) // Dark Green
                        StatItem("Absent", absentCount.toString(), Color(0xFFC62828)) // Dark Red
                    }
                    
                    Spacer(modifier = Modifier.height(8.dp))

                    LazyColumn(
                        contentPadding = PaddingValues(bottom = 16.dp)
                    ) {
                        items(results) { result ->
                            ResultItem(result)
                        }
                    }
                } else {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("Select a Class to view logs", color = Color.Gray)
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
