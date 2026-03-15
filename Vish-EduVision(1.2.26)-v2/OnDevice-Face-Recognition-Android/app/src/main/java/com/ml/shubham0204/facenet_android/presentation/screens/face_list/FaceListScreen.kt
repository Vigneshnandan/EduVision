package com.ml.shubham0204.facenet_android.presentation.screens.face_list

import android.text.format.DateUtils
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ml.shubham0204.facenet_android.data.PersonRecord
import com.ml.shubham0204.facenet_android.presentation.components.AppAlertDialog
import com.ml.shubham0204.facenet_android.presentation.components.createAlertDialog
import com.ml.shubham0204.facenet_android.presentation.theme.FaceNetAndroidTheme
import org.koin.androidx.compose.koinViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FaceListScreen(
    onNavigateBack: (() -> Unit),
    onAddFaceClick: (() -> Unit),
) {
    val viewModel: FaceListScreenViewModel = koinViewModel()
    val faces by viewModel.personFlow.collectAsState(emptyList())
    var searchQuery by remember { mutableStateOf("") }
    
    // Filtered Faces
    val filteredFaces = faces.filter {
        it.personName.contains(searchQuery, ignoreCase = true) ||
        it.studentClass.contains(searchQuery, ignoreCase = true) ||
        it.rollNumber.contains(searchQuery, ignoreCase = true)
    }

    FaceNetAndroidTheme {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            "Students List",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = Color.White
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = onNavigateBack) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Default.ArrowBack,
                                contentDescription = "Navigate Back",
                                tint = Color.White
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color(0xFF29B6F6) // Sky Blue
                    )
                )
            },
            floatingActionButton = {
                FloatingActionButton(
                    onClick = onAddFaceClick,
                    containerColor = Color(0xFF29B6F6),
                    contentColor = Color.White
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = "Add a new face")
                }
            },
            containerColor = Color.White
        ) { innerPadding ->
            Column(modifier = Modifier.padding(innerPadding)) {
                
                // Search Bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    label = { Text("Search Students") },
                    leadingIcon = { Icon(Icons.Default.Search, null, tint = Color.Black) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.Black,
                        unfocusedTextColor = Color.Black,
                        focusedLabelColor = Color.Black,
                        unfocusedLabelColor = Color.Gray,
                        cursorColor = Color.Black
                    )
                )

                // Stats Bar
                Row(
                   modifier = Modifier
                       .fillMaxWidth()
                       .padding(horizontal = 16.dp, vertical = 8.dp)
                       .background(Color(0xFFE1F5FE), RoundedCornerShape(8.dp))
                       .padding(8.dp),
                   verticalAlignment = Alignment.CenterVertically,
                   horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        "Total: ${faces.size}",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFF0277BD)
                    )
                    Text(
                        "Showing: ${filteredFaces.size}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF01579B)
                    )
                }

                ScreenUI(filteredFaces, viewModel)
                AppAlertDialog()
            }
        }
    }
}

@Composable
private fun ScreenUI(faces: List<PersonRecord>, viewModel: FaceListScreenViewModel) {
    LazyColumn(
        contentPadding = PaddingValues(bottom = 80.dp)
    ) { 
        items(faces) { 
            FaceListItem(it) { viewModel.removeFace(it.personID) } 
        } 
    }
}

@Composable
private fun FaceListItem(
    personRecord: PersonRecord,
    onRemoveFaceClick: (() -> Unit),
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        border = BorderStroke(1.dp, Color(0xFFE0E0E0))
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Initials Avatar
            Box(
                modifier = Modifier
                    .size(50.dp)
                    .background(Color(0xFFE1F5FE), RoundedCornerShape(25.dp)),
                contentAlignment = Alignment.Center
            ) {
                 Text(
                    text = personRecord.personName.take(1).uppercase(),
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    color = Color(0xFF0277BD)
                 )
            }
            
            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = personRecord.personName,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = Color.Black
                )
                Text(
                    text = "Class: ${personRecord.studentClass} | Roll: ${personRecord.rollNumber}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Gray
                )
                Text(
                    text = "Added: " + DateUtils.getRelativeTimeSpanString(personRecord.addTime).toString(),
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.LightGray,
                )
            }
            
            IconButton(onClick = {
                    createAlertDialog(
                        dialogTitle = "Remove Student",
                        dialogText = "Are you sure you want to remove ${personRecord.personName}?",
                        dialogPositiveButtonText = "Remove",
                        onPositiveButtonClick = onRemoveFaceClick,
                        dialogNegativeButtonText = "Cancel",
                        onNegativeButtonClick = {},
                    )
            }) {
                Icon(
                    imageVector = Icons.Default.Clear,
                    contentDescription = "Remove",
                    tint = Color(0xFFEF5350)
                )
            }
        }
    }
}
