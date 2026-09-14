package com.ml.shubham0204.facenet_android.presentation.screens.face_list

import android.text.format.DateUtils
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.OfflineBolt
import androidx.compose.material.icons.filled.PersonAddAlt1
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.ml.shubham0204.facenet_android.data.PersonRecord
import com.ml.shubham0204.facenet_android.presentation.components.AppAlertDialog
import com.ml.shubham0204.facenet_android.presentation.components.AppLogoLockup
import com.ml.shubham0204.facenet_android.presentation.components.AppSearchField
import com.ml.shubham0204.facenet_android.presentation.components.StatTile
import com.ml.shubham0204.facenet_android.presentation.components.createAlertDialog
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
    var selectedClassFilter by remember { mutableStateOf<String?>(null) }

    // Distinct classes derived from the existing faces list — no new query.
    val classes = remember(faces) { faces.map { it.studentClass }.distinct() }

    // Filtered Faces — search text AND selected class chip must both match.
    val filteredFaces = faces.filter { person ->
        val matchesSearch = person.personName.contains(searchQuery, ignoreCase = true) ||
            person.studentClass.contains(searchQuery, ignoreCase = true) ||
            person.rollNumber.contains(searchQuery, ignoreCase = true)
        val matchesClassFilter = selectedClassFilter == null || person.studentClass == selectedClassFilter
        matchesSearch && matchesClassFilter
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Students",
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
                actions = {
                    // Placeholder for a future overflow menu (sort/export/etc.) —
                    // not wired up to any action yet.
                    IconButton(onClick = {}) {
                        Icon(
                            imageVector = Icons.Default.MoreVert,
                            contentDescription = "More options",
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
            ExtendedFloatingActionButton(
                onClick = onAddFaceClick,
                containerColor = Color(0xFF29B6F6),
                contentColor = Color.White,
                icon = { Icon(imageVector = Icons.Default.Add, contentDescription = null) },
                text = { Text("Add Student") },
            )
        },
        containerColor = Color.White
    ) { innerPadding ->
        Column(modifier = Modifier.padding(innerPadding).fillMaxSize()) {

            // Header: compact brand lockup, right-aligned
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.End,
            ) {
                AppLogoLockup(
                    showTagline = true,
                    tagline = "Better Students Brighter Tomorrows",
                    compact = true,
                )
            }

            if (faces.isEmpty()) {
                EmptyStudentsState(
                    onAddFaceClick = onAddFaceClick,
                    modifier = Modifier.weight(1f),
                )
            } else {
                AppSearchField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = "Search by name, roll number or class",
                    modifier = Modifier.padding(horizontal = 16.dp),
                )

                Spacer(modifier = Modifier.height(12.dp))

                ClassFilterChipsRow(
                    classes = classes,
                    selectedClass = selectedClassFilter,
                    onClassSelected = { selectedClassFilter = it },
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    StatTile(
                        icon = Icons.Filled.Groups,
                        value = faces.size.toString(),
                        label = "Total Students",
                        containerColor = Color(0xFFE1F5FE),
                        contentColor = Color(0xFF0277BD),
                        modifier = Modifier.weight(1f),
                    )
                    StatTile(
                        icon = Icons.Filled.Search,
                        value = filteredFaces.size.toString(),
                        label = "Showing",
                        containerColor = Color(0xFFE1F5FE),
                        contentColor = Color(0xFF01579B),
                        modifier = Modifier.weight(1f),
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                ScreenUI(filteredFaces, viewModel)
            }
            AppAlertDialog()
        }
    }
}

@Composable
private fun ClassFilterChipsRow(
    classes: List<String>,
    selectedClass: String?,
    onClassSelected: (String?) -> Unit,
) {
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        item {
            FilterChip(
                selected = selectedClass == null,
                onClick = { onClassSelected(null) },
                label = { Text("All") },
            )
        }
        items(classes) { classItem ->
            FilterChip(
                selected = selectedClass == classItem,
                onClick = { onClassSelected(classItem) },
                label = { Text(classItem) },
            )
        }
    }
}

@Composable
private fun EmptyStudentsState(
    onAddFaceClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(
            modifier = Modifier
                .size(96.dp)
                .background(Color(0xFFE1F5FE), RoundedCornerShape(24.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = Icons.Filled.PersonAddAlt1,
                contentDescription = null,
                tint = Color(0xFF0288D1),
                modifier = Modifier.size(48.dp),
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            "No students registered yet",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = Color.Black,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            "Add your first student to start taking attendance.",
            style = MaterialTheme.typography.bodyMedium,
            color = Color.Gray,
            textAlign = TextAlign.Center,
        )

        Spacer(modifier = Modifier.height(20.dp))

        Button(
            onClick = onAddFaceClick,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF29B6F6)),
            shape = RoundedCornerShape(12.dp),
        ) {
            Icon(Icons.Default.Add, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Add Student", fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            "\"Every student counts\"",
            style = MaterialTheme.typography.bodySmall.copy(fontStyle = FontStyle.Italic),
            color = Color.Gray,
        )

        Spacer(modifier = Modifier.height(24.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            FeatureCallout(Icons.Filled.Shield, "Secure & Private", modifier = Modifier.weight(1f))
            FeatureCallout(Icons.Filled.OfflineBolt, "On-device AI", modifier = Modifier.weight(1f))
            FeatureCallout(Icons.Filled.CheckCircle, "Smarter Attendance", modifier = Modifier.weight(1f))
        }
    }
}

@Composable
private fun FeatureCallout(icon: ImageVector, label: String, modifier: Modifier = Modifier) {
    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(Color(0xFFE1F5FE), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = Color(0xFF0288D1),
                modifier = Modifier.size(20.dp),
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = Color.Black,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun ScreenUI(faces: List<PersonRecord>, viewModel: FaceListScreenViewModel) {
    LazyColumn(
        contentPadding = PaddingValues(bottom = 96.dp)
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
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, Color(0xFFE0E0E0))
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Initials Avatar — no photos are stored per student, so we keep
            // using the first-letter-of-name avatar rather than an image.
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
                    text = "${personRecord.studentClass} • Roll No. ${personRecord.rollNumber}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Gray
                )
                Text(
                    text = "Added " + DateUtils.getRelativeTimeSpanString(personRecord.addTime).toString(),
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.LightGray,
                )
            }

            IconButton(onClick = {
                    createAlertDialog(
                        dialogTitle = "Remove Student?",
                        dialogText = "Are you sure you want to remove ${personRecord.personName}?",
                        dialogPositiveButtonText = "Remove",
                        onPositiveButtonClick = onRemoveFaceClick,
                        dialogNegativeButtonText = "Cancel",
                        onNegativeButtonClick = {},
                    )
            }) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = "Remove",
                    tint = Color(0xFFEF5350)
                )
            }
        }
    }
}
