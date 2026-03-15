package com.ml.shubham0204.facenet_android.presentation.screens.detect_screen

import android.Manifest
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.activity.compose.ManagedActivityResultLauncher
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import kotlin.OptIn
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Cameraswitch
import androidx.compose.material.icons.filled.Class
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Face
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.app.ActivityCompat
import com.ml.shubham0204.facenet_android.R
import com.ml.shubham0204.facenet_android.presentation.components.AppAlertDialog
import com.ml.shubham0204.facenet_android.presentation.components.DelayedVisibility
import com.ml.shubham0204.facenet_android.presentation.components.FaceDetectionOverlay
import com.ml.shubham0204.facenet_android.presentation.components.createAlertDialog
import com.ml.shubham0204.facenet_android.presentation.theme.FaceNetAndroidTheme
import org.koin.androidx.compose.koinViewModel
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.foundation.clickable
import androidx.compose.material3.TextButton

private val cameraPermissionStatus = mutableStateOf(false)
private val cameraFacing = mutableIntStateOf(CameraSelector.LENS_FACING_BACK)
private lateinit var cameraPermissionLauncher: ManagedActivityResultLauncher<String, Boolean>

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DetectScreen(onOpenFaceListClick: (() -> Unit), onAttendanceEnd: (String, Long) -> Unit) {
    val viewModel: DetectScreenViewModel = koinViewModel()
    val context = LocalContext.current
    var isClassSelected by remember { mutableStateOf(false) }
    var className by remember { mutableStateOf("") }
    
    // Load classes on init
    LaunchedEffect(Unit) {
        viewModel.loadClasses()
    }

    LaunchedEffect(Unit) {
        viewModel.attendanceMessages.collect { message ->
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    FaceNetAndroidTheme {
        Scaffold(
            modifier = Modifier.fillMaxSize(),
            containerColor = Color.White,
            topBar = {
                TopAppBar(
                    colors = TopAppBarDefaults.topAppBarColors(),
                    title = {
                        Text(
                            text = if (isClassSelected) "Attendance: $className" else "Enter Class",
                            style = MaterialTheme.typography.headlineSmall,
                        )
                    },
                    actions = {
                        if (isClassSelected) {
                            Button(onClick = { onAttendanceEnd(className, viewModel.attendanceDate.value) }) {
                                Text("End Attendance")
                            }
                        }
                    },
                )
            },
        ) { innerPadding ->
            Column(modifier = Modifier.padding(innerPadding)) {
                if (!isClassSelected) {
                    ClassSelectionScreen(
                        viewModel = viewModel,
                        onClassSelected = { enteredClass ->
                            className = enteredClass
                            viewModel.setClass(enteredClass)
                            isClassSelected = true
                        }
                    )
                } else {
                    ScreenUI(viewModel)
                }
            }
        }
    }
}


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClassSelectionScreen(viewModel: DetectScreenViewModel, onClassSelected: (String) -> Unit) {
    val classes by remember { viewModel.classesState }
    var expanded by remember { mutableStateOf(false) }
    var selectedClass by remember { mutableStateOf("") }
    
    // Date Picker State
    val dateState by remember { viewModel.attendanceDate }
    val datePickerState = rememberDatePickerState(initialSelectedDateMillis = dateState)
    var showDatePicker by remember { mutableStateOf(false) }

    val currentDate = remember(dateState) { 
        java.text.SimpleDateFormat("dd MMM yyyy", java.util.Locale.getDefault()).format(java.util.Date(dateState)) 
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

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Instructions Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFE1F5FE)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    "Instructions",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = Color.Black // Ensuring Black Text
                )
                Spacer(modifier = Modifier.height(8.dp))
                InstructionItem("1. Select the Class from the dropdown.")
                InstructionItem("2. Ensure good lighting for the camera.")
                InstructionItem("3. Point camera at students one by one.")
                InstructionItem("4. Verify 'Marked Present' toast message.")
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Text("Attendance Settings", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Color.Black)
        Spacer(modifier = Modifier.height(16.dp))
        
        // Date Display
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
                    disabledLabelColor = Color.Black, // Ensure label stays visible
                    disabledBorderColor = Color.Gray,
                    disabledLeadingIconColor = Color.Black
                ),
                enabled = false // Disable editing, rely on overlay for click
            )
            // Transparent overlay for click
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .clickable { showDatePicker = true }
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))

        // Class Dropdown
        ExposedDropdownMenuBox(
            expanded = expanded,
            onExpandedChange = { expanded = !expanded },
            modifier = Modifier.fillMaxWidth()
        ) {
            OutlinedTextField(
                value = selectedClass,
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
                                selectedClass = classItem
                                expanded = false
                            }
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
        
        Button(
            onClick = { if (selectedClass.isNotEmpty()) onClassSelected(selectedClass) },
            modifier = Modifier.fillMaxWidth().height(50.dp),
            enabled = selectedClass.isNotEmpty(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFF29B6F6),
                disabledContainerColor = Color(0xFFB3E5FC),
                contentColor = Color.White
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(Icons.Default.CameraAlt, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Live Attendance", fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun InstructionItem(text: String) {
    Row(modifier = Modifier.padding(vertical = 4.dp)) {
        Text("• ", fontWeight = FontWeight.Bold, color = Color.Black)
        Text(text, style = MaterialTheme.typography.bodyMedium, color = Color.Black)
    }
}

@Composable
private fun ScreenUI(viewModel: DetectScreenViewModel) {
    Box {
        Camera(viewModel)
        DelayedVisibility(viewModel.getNumPeople() > 0) {
            val metrics by remember { viewModel.faceDetectionMetricsState }
            Column {
                Text(
                    text = "Recognition on ${viewModel.getNumPeople()} face(s)",
                    color = Color.White,
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center,
                )
                Spacer(modifier = Modifier.weight(1f))
                metrics?.let {
                    Text(
                        text =
                            "face detection: ${it.timeFaceDetection} ms" +
                                "\nface embedding: ${it.timeFaceEmbedding} ms" +
                                "\nvector search: ${it.timeVectorSearch} ms\n" +
                                "spoof detection: ${it.timeFaceSpoofDetection} ms",
                        color = Color.White,
                        modifier =
                            Modifier
                                .fillMaxWidth()
                                .padding(bottom = 24.dp),
                        textAlign = TextAlign.Center,
                    )
                }
            }
        }
        DelayedVisibility(viewModel.getNumPeople() == 0L) {
            Text(
                text = "No images in database",
                color = Color.White,
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                        .background(Color.Blue, RoundedCornerShape(16.dp))
                        .padding(8.dp),
                textAlign = TextAlign.Center,
            )
        }
        AppAlertDialog()
    }
}

@OptIn(ExperimentalGetImage::class)
@Composable
private fun Camera(viewModel: DetectScreenViewModel) {
    val context = LocalContext.current
    cameraPermissionStatus.value =
        ActivityCompat.checkSelfPermission(context, Manifest.permission.CAMERA) ==
        PackageManager.PERMISSION_GRANTED
    val cameraFacing by remember { viewModel.cameraFacing }
    val lifecycleOwner = LocalLifecycleOwner.current

    cameraPermissionLauncher =
        rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
            if (it) {
                cameraPermissionStatus.value = true
            } else {
                camaraPermissionDialog()
            }
        }

    DelayedVisibility(cameraPermissionStatus.value) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { FaceDetectionOverlay(lifecycleOwner, context, viewModel) },
            update = { it.initializeCamera(cameraFacing) },
        )
    }
    DelayedVisibility(!cameraPermissionStatus.value) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                "Allow Camera Permissions\nThe app cannot work without the camera permission.",
                textAlign = TextAlign.Center,
            )
            Button(
                onClick = { cameraPermissionLauncher.launch(Manifest.permission.CAMERA) },
                modifier = Modifier.align(Alignment.CenterHorizontally),
            ) {
                Text(text = "Allow")
            }
        }
    }
}

private fun camaraPermissionDialog() {
    createAlertDialog(
        "Camera Permission",
        "The app couldn't function without the camera permission.",
        "ALLOW",
        "CLOSE",
        onPositiveButtonClick = { cameraPermissionLauncher.launch(Manifest.permission.CAMERA) },
        onNegativeButtonClick = {
            // TODO: Handle deny camera permission action
            //       close the app
        },
    )
}
