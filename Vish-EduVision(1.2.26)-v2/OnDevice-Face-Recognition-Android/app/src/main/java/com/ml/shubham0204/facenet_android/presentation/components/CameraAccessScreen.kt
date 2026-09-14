package com.ml.shubham0204.facenet_android.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val brandNavy = Color(0xFF004DA6)
private val brandSkyBlue = Color(0xFF29B6F6)

/**
 * Standalone "please grant camera access" screen shown in place of the
 * camera preview until the permission is granted. Purely presentational —
 * callers decide what "Allow" and "Not now" actually do.
 */
@Composable
fun CameraAccessScreen(
    onAllowClick: () -> Unit,
    onNotNowClick: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(horizontal = 24.dp, vertical = 16.dp),
    ) {
        // Header: back arrow + title + brand lockup
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onNotNowClick) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.Black,
                )
            }
            Text(
                text = "Camera Access",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = Color.Black,
                modifier = Modifier.weight(1f),
            )
            AppLogoLockup(showTagline = false)
        }

        Spacer(modifier = Modifier.height(32.dp))

        Column(
            modifier = Modifier.weight(1f),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            CameraIllustration()

            Spacer(modifier = Modifier.height(32.dp))

            Text(
                text = "Camera access is required",
                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                color = Color.Black,
                textAlign = TextAlign.Center,
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "Edu Vision uses your camera to detect and recognize students during attendance.",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Gray,
                textAlign = TextAlign.Center,
            )

            Spacer(modifier = Modifier.height(24.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFE1F5FE)),
                shape = RoundedCornerShape(12.dp),
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        imageVector = Icons.Filled.Shield,
                        contentDescription = null,
                        tint = brandNavy,
                        modifier = Modifier.size(24.dp),
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "Face recognition happens on-device. Your data stays on your " +
                            "device and is not shared with any external servers.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Black,
                    )
                }
            }
        }

        Button(
            onClick = onAllowClick,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = brandSkyBlue),
        ) {
            Text("Allow Camera", fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }

        TextButton(
            onClick = onNotNowClick,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Not now", color = Color.Gray)
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "A smarter way to a brighter tomorrow",
            style = MaterialTheme.typography.labelSmall,
            color = Color.Gray,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun CameraIllustration() {
    Box(
        modifier = Modifier.size(160.dp),
        contentAlignment = Alignment.Center,
    ) {
        // Soft rounded background
        Box(
            modifier = Modifier
                .size(140.dp)
                .background(brandSkyBlue.copy(alpha = 0.15f), RoundedCornerShape(40.dp)),
        )

        // Shine accents
        Box(
            modifier = Modifier
                .size(14.dp)
                .align(Alignment.TopStart)
                .offset(x = 8.dp, y = 4.dp)
                .background(brandSkyBlue.copy(alpha = 0.4f), CircleShape),
        )
        Box(
            modifier = Modifier
                .size(8.dp)
                .align(Alignment.BottomStart)
                .offset(x = 20.dp, y = (-12).dp)
                .background(brandSkyBlue.copy(alpha = 0.3f), CircleShape),
        )

        Icon(
            imageVector = Icons.Filled.CameraAlt,
            contentDescription = null,
            tint = brandNavy,
            modifier = Modifier.size(56.dp),
        )

        // Lock/shield badge overlapping the corner
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .offset(x = (-4).dp, y = (-4).dp)
                .size(36.dp)
                .background(brandNavy, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = Icons.Filled.Shield,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(18.dp),
            )
        }
    }
}
