package com.ml.shubham0204.facenet_android.presentation.screens.add_face

import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.ml.shubham0204.facenet_android.presentation.components.AppProgressDialog
import com.ml.shubham0204.facenet_android.presentation.components.DelayedVisibility
import com.ml.shubham0204.facenet_android.presentation.components.hideProgressDialog
import com.ml.shubham0204.facenet_android.presentation.components.showProgressDialog
import com.ml.shubham0204.facenet_android.presentation.theme.FaceNetAndroidTheme
import org.koin.androidx.compose.koinViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddFaceScreen(onNavigateBack: (() -> Unit)) {
    FaceNetAndroidTheme {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { 
                        Text(
                            "Student Registration",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), 
                            color = Color.White
                        ) 
                    },
                    navigationIcon = {
                        IconButton(onClick = onNavigateBack) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Default.ArrowBack,
                                contentDescription = "Back",
                                tint = Color.White
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color(0xFF29B6F6) // Sky Blue
                    )
                )
            },
            containerColor = Color.White
        ) { innerPadding ->
            Column(modifier = Modifier.padding(innerPadding)) {
                val viewModel: AddFaceScreenViewModel = koinViewModel()
                ScreenUI(viewModel)
                ImageReadProgressDialog(viewModel, onNavigateBack)
            }
        }
    }
}

@Composable
private fun ScreenUI(viewModel: AddFaceScreenViewModel) {
    val pickVisualMediaLauncher =
        rememberLauncherForActivityResult(
            contract = ActivityResultContracts.PickMultipleVisualMedia(),
        ) {
            viewModel.selectedImageURIs.value = it
        }
    var personName by remember { viewModel.personNameState }
    var studentClass by remember { viewModel.studentClassState }
    var rollNumber by remember { viewModel.rollNumberState }
    
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Photo Capture Area
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp),
            shape = RoundedCornerShape(16.dp),
            border = BorderStroke(1.dp, Color(0xFFE0E0E0)),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFF5F5F5))
        ) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                if (viewModel.selectedImageURIs.value.isEmpty()) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.CameraAlt,
                            contentDescription = null,
                            modifier = Modifier.size(48.dp),
                            tint = Color.Gray
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("No photos selected", color = Color.Gray)
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = { 
                                pickVisualMediaLauncher.launch(
                                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                )
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF29B6F6))
                        ) {
                            Text("Select Photos")
                        }
                    }
                } else {
                    ImagesGrid(viewModel)
                    // Overlay "Change Photos" button or similar if needed, 
                    // but for now keeping it simple. Or allow re-selection.
                     Button(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 8.dp),
                        onClick = { 
                             pickVisualMediaLauncher.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                            )
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha=0.8f))
                    ) {
                        Text("Change Photos", color = Color.Black)
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))

        // Student Details Form
        Text(
            "Student Details",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            modifier = Modifier.align(Alignment.Start),
            color = Color.Black
        )
        Spacer(modifier = Modifier.height(16.dp))
        
        val textFieldColors = OutlinedTextFieldDefaults.colors(
            focusedTextColor = Color.Black,
            unfocusedTextColor = Color.Black,
            focusedLabelColor = Color.Black,
            unfocusedLabelColor = Color.Gray,
            cursorColor = Color.Black
        )

        OutlinedTextField(
            modifier = Modifier.fillMaxWidth(),
            value = personName,
            onValueChange = { personName = it },
            label = { Text("Full Name") },
            leadingIcon = { Icon(Icons.Default.Person, null, tint = Color.Black) },
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            colors = textFieldColors
        )
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            modifier = Modifier.fillMaxWidth(),
            value = rollNumber,
            onValueChange = { rollNumber = it },
            label = { Text("Roll Number") },
            leadingIcon = { Icon(Icons.Default.CreditCard, null, tint = Color.Black) },
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            colors = textFieldColors
        )
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            modifier = Modifier.fillMaxWidth(),
            value = studentClass,
            onValueChange = { studentClass = it },
            label = { Text("Class") },
            leadingIcon = { Icon(Icons.Default.Book, null, tint = Color.Black) }, // Using Book as Notebook icon
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            colors = textFieldColors
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Button(
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            enabled = viewModel.personNameState.value.isNotEmpty() &&
                    viewModel.studentClassState.value.isNotEmpty() &&
                    viewModel.rollNumberState.value.isNotEmpty() &&
                    viewModel.selectedImageURIs.value.isNotEmpty(),
            onClick = { viewModel.addImages() },
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFF29B6F6),
                disabledContainerColor = Color(0xFFB3E5FC)
            )
        ) {
            Text("Register Student", fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun ImagesGrid(viewModel: AddFaceScreenViewModel) {
    val uris by remember { viewModel.selectedImageURIs }
    LazyVerticalGrid(columns = GridCells.Fixed(2)) {
        items(uris) { AsyncImage(model = it, contentDescription = null) }
    }
}

@Composable
private fun ImageReadProgressDialog(
    viewModel: AddFaceScreenViewModel,
    onNavigateBack: () -> Unit,
) {
    val isProcessing by remember { viewModel.isProcessingImages }
    val numImagesProcessed by remember { viewModel.numImagesProcessed }
    val context = LocalContext.current
    AppProgressDialog()
    if (isProcessing) {
        showProgressDialog()
    } else {
        if (numImagesProcessed > 0) {
            onNavigateBack()
            Toast.makeText(context, "Added to database", Toast.LENGTH_SHORT).show()
        }
        hideProgressDialog()
    }
}
