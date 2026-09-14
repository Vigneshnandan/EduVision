package com.ml.shubham0204.facenet_android.presentation.screens.log

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Class
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ml.shubham0204.facenet_android.data.ConnectivityChecker
import com.ml.shubham0204.facenet_android.data.SettingsStore
import com.ml.shubham0204.facenet_android.domain.AttendanceUseCase
import com.ml.shubham0204.facenet_android.domain.PersonUseCase
import com.ml.shubham0204.facenet_android.presentation.components.AppSearchField
import com.ml.shubham0204.facenet_android.presentation.components.CircularPercentRing
import com.ml.shubham0204.facenet_android.presentation.components.ResultItem
import com.ml.shubham0204.facenet_android.presentation.components.StatTile
import com.ml.shubham0204.facenet_android.presentation.components.StatusPill
import com.ml.shubham0204.facenet_android.presentation.components.StudentResult
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
    private val cloudSyncRepository: CloudSyncRepository,
    private val settingsStore: SettingsStore,
    private val connectivityChecker: ConnectivityChecker,
) : ViewModel() {
    val classesState = mutableStateOf<List<String>>(emptyList())
    val results = mutableStateListOf<StudentResult>()
    val isSyncing = mutableStateOf(false)

    // Sync status — derived from SettingsStore + a live connectivity check,
    // no ObjectBox schema changes required.
    val isOnline = mutableStateOf(true)
    val pendingCount = mutableStateOf(0)
    val lastSyncTime = mutableStateOf<Long?>(null)

    // UI Events
    private val _syncMessage = MutableSharedFlow<String>()
    val syncMessage = _syncMessage.asSharedFlow()

    init {
        refreshSyncStatus()
    }

    fun refreshSyncStatus() {
        viewModelScope.launch {
            isOnline.value = connectivityChecker.isOnline()
            val savedTimestamp = settingsStore.get(LAST_SYNC_TIMESTAMP_KEY)?.toLongOrNull()
            lastSyncTime.value = savedTimestamp
            pendingCount.value = attendanceUseCase.countPendingSince(savedTimestamp ?: 0L).toInt()
        }
    }

    fun syncAttendance() {
        viewModelScope.launch {
            isSyncing.value = true
            _syncMessage.emit("Starting Sync...")
            val result = cloudSyncRepository.syncAttendance()
            result.onSuccess { message ->
                settingsStore.save(LAST_SYNC_TIMESTAMP_KEY, System.currentTimeMillis().toString())
                isSyncing.value = false
                refreshSyncStatus()
                _syncMessage.emit("Sync Success: $message")
            }.onFailure { e ->
                isSyncing.value = false
                refreshSyncStatus()
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

    companion object {
        private const val LAST_SYNC_TIMESTAMP_KEY = "last_sync_timestamp"
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AttendanceLogScreen(onNavigateBack: () -> Unit) {
    val viewModel: AttendanceLogViewModel = koinViewModel()

    // Load Classes + refresh sync status
    LaunchedEffect(Unit) {
        viewModel.loadClasses()
        viewModel.refreshSyncStatus()
    }

    val context = androidx.compose.ui.platform.LocalContext.current
    LaunchedEffect(Unit) {
        viewModel.syncMessage.collect { message ->
            android.widget.Toast.makeText(context, message, android.widget.Toast.LENGTH_SHORT).show()
        }
    }

    val classes by remember { viewModel.classesState }
    val isSyncing by remember { viewModel.isSyncing }
    val isOnline by remember { viewModel.isOnline }
    val pendingCount by remember { viewModel.pendingCount }
    val lastSyncTime by remember { viewModel.lastSyncTime }
    val results = viewModel.results
    var expanded by remember { mutableStateOf(false) }
    var searchQuery by remember { mutableStateOf("") }

    // Date Picker State
    val dateState by remember { viewModel.selectedDate }
    val datePickerState = rememberDatePickerState(initialSelectedDateMillis = dateState)
    var showDatePicker by remember { mutableStateOf(false) }

    val currentDate = remember(dateState) {
        java.text.SimpleDateFormat("dd MMM yyyy", java.util.Locale.getDefault()).format(Date(dateState))
    }

    val filteredResults = results.filter {
        it.person.personName.contains(searchQuery, ignoreCase = true) ||
            it.person.rollNumber.contains(searchQuery, ignoreCase = true)
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
                    SyncStatusPill(
                        isSyncing = isSyncing,
                        isOnline = isOnline,
                        pendingCount = pendingCount,
                        lastSyncTime = lastSyncTime,
                        modifier = Modifier.padding(end = 12.dp),
                    )
                }
            )
        },
        containerColor = Color.White,
        bottomBar = {
            SyncAttendanceBar(
                isSyncing = isSyncing,
                pendingCount = pendingCount,
                onSyncClick = { viewModel.syncAttendance() },
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {

            if (isSyncing) {
                SyncingBanner()
            } else if (!isOnline) {
                OfflineBanner()
            }

            // Filters Card
            Card(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, Color(0xFFE0E0E0))
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

            // Overview + Records
            if (viewModel.selectedClass.value.isNotEmpty()) {
                val totalStudents = results.size
                val presentCount = results.count { it.isPresent }
                val absentCount = results.count { !it.isPresent }
                val percent = if (totalStudents > 0) (presentCount * 100 / totalStudents) else 0

                AttendanceOverviewCard(
                    total = totalStudents,
                    present = presentCount,
                    absent = absentCount,
                    percent = percent,
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    "Student Records",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = Color.Black,
                    modifier = Modifier.padding(horizontal = 16.dp),
                )
                Spacer(modifier = Modifier.height(8.dp))

                AppSearchField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = "Search by name or roll number",
                    modifier = Modifier.padding(horizontal = 16.dp),
                )

                Spacer(modifier = Modifier.height(8.dp))

                Column(modifier = Modifier.padding(bottom = 16.dp)) {
                    filteredResults.forEach { result ->
                        ResultItem(result)
                    }
                }
            } else {
                SelectClassEmptyState()
            }
        }
    }
}

private data class SyncPillStyle(
    val text: String,
    val icon: ImageVector,
    val containerColor: Color,
    val contentColor: Color,
)

@Composable
private fun SyncStatusPill(
    isSyncing: Boolean,
    isOnline: Boolean,
    pendingCount: Int,
    lastSyncTime: Long?,
    modifier: Modifier = Modifier,
) {
    val style = when {
        isSyncing -> SyncPillStyle(
            text = "Syncing... Please wait",
            icon = Icons.Filled.Sync,
            containerColor = Color(0xFFE1F5FE),
            contentColor = Color(0xFF0288D1),
        )
        !isOnline -> SyncPillStyle(
            text = "Offline • $pendingCount records pending",
            icon = Icons.Filled.CloudOff,
            containerColor = Color(0xFFFFF3E0),
            contentColor = Color(0xFFEF6C00),
        )
        lastSyncTime != null -> SyncPillStyle(
            text = "Synced — Last synced ${formatSyncTime(lastSyncTime)}",
            icon = Icons.Filled.CloudDone,
            containerColor = Color(0xFFE8F5E9),
            contentColor = Color(0xFF2E7D32),
        )
        else -> SyncPillStyle(
            text = "Not synced yet",
            icon = Icons.Filled.CloudOff,
            containerColor = Color(0xFFF5F5F5),
            contentColor = Color.Gray,
        )
    }
    StatusPill(
        text = style.text,
        icon = style.icon,
        containerColor = style.containerColor,
        contentColor = style.contentColor,
        modifier = modifier,
    )
}

private fun formatSyncTime(millis: Long): String =
    java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault()).format(Date(millis))

@Composable
private fun OfflineBanner() {
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF3E0)),
        shape = RoundedCornerShape(12.dp),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = Icons.Filled.CloudOff,
                contentDescription = null,
                tint = Color(0xFFEF6C00),
                modifier = Modifier.size(20.dp),
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    "Working offline",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = Color(0xFFE65100),
                )
                Text(
                    "Data will sync automatically when your connection returns.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFFEF6C00),
                )
            }
        }
    }
}

@Composable
private fun SyncingBanner() {
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFE1F5FE)),
        shape = RoundedCornerShape(12.dp),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                color = Color(0xFF0288D1),
                strokeWidth = 2.dp,
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    "Syncing... Please wait",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = Color(0xFF01579B),
                )
                Text(
                    "Uploading attendance records to the server.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF0288D1),
                )
            }
        }
    }
}

@Composable
private fun AttendanceOverviewCard(total: Int, present: Int, absent: Int, percent: Int) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, Color(0xFFE0E0E0)),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                "Attendance Overview",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = Color.Black,
            )
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                StatTile(
                    icon = Icons.Filled.Groups,
                    value = total.toString(),
                    label = "Total",
                    containerColor = Color(0xFFF5F5F5),
                    contentColor = Color.Black,
                    modifier = Modifier.weight(1f),
                )
                StatTile(
                    icon = Icons.Filled.CheckCircle,
                    value = present.toString(),
                    label = "Present",
                    containerColor = Color(0xFFE8F5E9),
                    contentColor = Color(0xFF2E7D32),
                    modifier = Modifier.weight(1f),
                )
                StatTile(
                    icon = Icons.Filled.Cancel,
                    value = absent.toString(),
                    label = "Absent",
                    containerColor = Color(0xFFFFEBEE),
                    contentColor = Color(0xFFC62828),
                    modifier = Modifier.weight(1f),
                )
            }
            Spacer(modifier = Modifier.height(20.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(72.dp)) {
                    CircularPercentRing(percent = percent, modifier = Modifier.fillMaxSize())
                }
                val isGoodAttendance = percent >= 75
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(start = 16.dp),
                ) {
                    Text(
                        text = if (isGoodAttendance) "Good Attendance!" else "Needs Attention",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = if (isGoodAttendance) Color(0xFF2E7D32) else Color(0xFFC62828),
                    )
                    Text(
                        text = "$present of $total students present today",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray,
                    )
                }
            }
        }
    }
}

@Composable
private fun SelectClassEmptyState(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .background(Color(0xFFE1F5FE), RoundedCornerShape(20.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = Icons.Default.Class,
                contentDescription = null,
                tint = Color(0xFF0288D1),
                modifier = Modifier.size(36.dp),
            )
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            "Select a class to view logs",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = Color.Black,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            "Choose a class above to see attendance records for that day.",
            style = MaterialTheme.typography.bodySmall,
            color = Color.Gray,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun SyncAttendanceBar(
    isSyncing: Boolean,
    pendingCount: Int,
    onSyncClick: () -> Unit,
) {
    Surface(color = Color.White, shadowElevation = 8.dp) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
            Button(
                onClick = onSyncClick,
                enabled = !isSyncing,
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF29B6F6),
                    disabledContainerColor = Color(0xFFE0E0E0),
                    contentColor = Color.White,
                    disabledContentColor = Color(0xFF9E9E9E),
                )
            ) {
                if (isSyncing) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = Color(0xFF9E9E9E),
                        strokeWidth = 2.dp,
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Syncing...", fontWeight = FontWeight.Bold)
                } else {
                    Icon(Icons.Default.CloudUpload, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (pendingCount > 0) "Sync Attendance ($pendingCount pending)" else "Sync Attendance",
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
        }
    }
}

