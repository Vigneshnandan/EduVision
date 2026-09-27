package com.eduvision.attendance.presentation.screens.add_face

import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.eduvision.attendance.presentation.components.AppLogoLockup
import com.eduvision.attendance.presentation.components.AppProgressDialog
import com.eduvision.attendance.presentation.components.DelayedVisibility
import com.eduvision.attendance.presentation.components.hideProgressDialog
import com.eduvision.attendance.presentation.components.showProgressDialog
import org.koin.androidx.compose.koinViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddFaceScreen(onNavigateBack: (() -> Unit)) {
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

@Composable
private fun ScreenUI(viewModel: AddFaceScreenViewModel) {
    val pickVisualMediaLauncher =
        rememberLauncherForActivityResult(
            contract = ActivityResultContracts.PickMultipleVisualMedia(),
        ) {
            viewModel.selectedImageURIs.value = it
        }
    val onPickPhotosClick = {
        pickVisualMediaLauncher.launch(
            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
        )
    }

    var personName by remember { viewModel.personNameState }
    var studentClass by remember { viewModel.studentClassState }
    var rollNumber by remember { viewModel.rollNumberState }
    val selectedPhotos by remember { viewModel.selectedImageURIs }

    val isFormValid = personName.isNotEmpty() &&
        studentClass.isNotEmpty() &&
        rollNumber.isNotEmpty() &&
        selectedPhotos.isNotEmpty()

    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Header: brand lockup + small school-building illustration
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            AppLogoLockup(modifier = Modifier.weight(1f))
            SchoolBuildingIllustration()
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Photo Capture Area
        if (selectedPhotos.isEmpty()) {
            EmptyPhotosCard(onSelectPhotosClick = onPickPhotosClick)
        } else {
            SelectedPhotosCard(
                photoUris = selectedPhotos,
                onChangePhotosClick = onPickPhotosClick,
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Student Details Form
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            shape = RoundedCornerShape(16.dp),
            border = BorderStroke(1.dp, Color(0xFFE0E0E0)),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    "Student Details",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
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
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            enabled = isFormValid,
            onClick = { viewModel.addImages() },
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFF29B6F6),
                disabledContainerColor = Color(0xFFE0E0E0),
                contentColor = Color.White,
                disabledContentColor = Color(0xFF9E9E9E),
            )
        ) {
            Text("Register Student", fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = if (isFormValid) {
                "All details look good. Tap to register the student."
            } else {
                "Please fill in all details and add a photo to continue."
            },
            style = MaterialTheme.typography.bodySmall,
            color = if (isFormValid) Color(0xFF2E7D32) else Color.Gray,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun SchoolBuildingIllustration(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
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

@Composable
private fun EmptyPhotosCard(
    onSelectPhotosClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
                .dashedBorder(color = Color(0xFFB0BEC5), cornerRadiusDp = 16.dp)
                .background(Color(0xFFF5F5F5), RoundedCornerShape(16.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    imageVector = Icons.Filled.PhotoLibrary,
                    contentDescription = null,
                    modifier = Modifier.size(40.dp),
                    tint = Color.Gray
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    "Add student photos",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = Color.Black,
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "Select clear face photos for recognition",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray,
                    textAlign = TextAlign.Center,
                )
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onSelectPhotosClick,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF29B6F6)),
                    shape = RoundedCornerShape(12.dp),
                ) {
                    Text("Select Photos")
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = Icons.Filled.Shield,
                contentDescription = null,
                tint = Color.Gray,
                modifier = Modifier.size(14.dp),
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                "Photos are processed on-device",
                style = MaterialTheme.typography.labelSmall,
                color = Color.Gray,
            )
        }
    }
}

@Composable
private fun SelectedPhotosCard(
    photoUris: List<android.net.Uri>,
    onChangePhotosClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, Color(0xFFE0E0E0)),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    "Student Photos",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = Color.Black,
                    modifier = Modifier.weight(1f),
                )
                Icon(
                    imageVector = Icons.Filled.CheckCircle,
                    contentDescription = null,
                    tint = Color(0xFF2E7D32),
                    modifier = Modifier.size(16.dp),
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    "${photoUris.size} photos selected",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF2E7D32),
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(photoUris) { uri ->
                    AsyncImage(
                        model = uri,
                        contentDescription = null,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(100.dp)
                            .clip(RoundedCornerShape(12.dp)),
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Button(
                onClick = onChangePhotosClick,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFFE1F5FE),
                    contentColor = Color(0xFF0288D1),
                ),
                shape = RoundedCornerShape(12.dp),
            ) {
                Text("Change Photos")
            }
        }
    }
}

private fun Modifier.dashedBorder(
    color: Color,
    cornerRadiusDp: Dp = 16.dp,
    strokeWidthDp: Dp = 1.5.dp,
    dashLengthDp: Dp = 8.dp,
    gapLengthDp: Dp = 6.dp,
): Modifier = this.drawBehind {
    val strokeWidthPx = strokeWidthDp.toPx()
    drawRoundRect(
        color = color,
        cornerRadius = CornerRadius(cornerRadiusDp.toPx()),
        style = Stroke(
            width = strokeWidthPx,
            pathEffect = PathEffect.dashPathEffect(
                floatArrayOf(dashLengthDp.toPx(), gapLengthDp.toPx()),
                0f,
            ),
        ),
    )
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
