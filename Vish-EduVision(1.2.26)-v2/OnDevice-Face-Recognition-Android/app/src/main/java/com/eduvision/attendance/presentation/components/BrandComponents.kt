package com.eduvision.attendance.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

private val brandNavy = Color(0xFF004DA6)
private val brandSkyBlue = Color(0xFF29B6F6)

/**
 * The "EDU VISION" wordmark with a graduation-cap glyph, reused on the home
 * screen and anywhere else the app needs to present its identity.
 */
@Composable
fun AppLogoLockup(
    modifier: Modifier = Modifier,
    showTagline: Boolean = true,
    tagline: String = "AI Powered Attendance for a Smarter Tomorrow",
    compact: Boolean = false,
) {
    val iconBoxSize = if (compact) 26.dp else 36.dp
    val iconSize = if (compact) 14.dp else 20.dp
    val wordmarkStyle = if (compact) {
        MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
    } else {
        MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
    }
    val taglineStyle = if (compact) MaterialTheme.typography.labelSmall else MaterialTheme.typography.bodySmall

    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(iconBoxSize)
                    .background(
                        brush = Brush.linearGradient(listOf(brandSkyBlue, brandNavy)),
                        shape = RoundedCornerShape(10.dp),
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Filled.School,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(iconSize),
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Row {
                Text(text = "EDU", style = wordmarkStyle, color = brandNavy)
                Text(text = "VISION", style = wordmarkStyle, color = brandSkyBlue)
            }
        }
        if (showTagline) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = tagline,
                style = taglineStyle,
                color = Color.Gray,
            )
        }
    }
}

/**
 * A circular progress ring with a bold percentage centered inside it. Shared
 * by the home screen and the attendance results/logs screens.
 */
@Composable
fun CircularPercentRing(
    percent: Int,
    modifier: Modifier = Modifier,
    ringColor: Color = brandSkyBlue,
    trackColor: Color = brandSkyBlue.copy(alpha = 0.15f),
    strokeWidth: Dp = 8.dp,
) {
    val clampedPercent = percent.coerceIn(0, 100)
    val text = "$clampedPercent%"

    BoxWithConstraints(modifier = modifier, contentAlignment = Alignment.Center) {
        // Font size scales with the ring's own diameter (density-aware, via
        // LocalDensity) so bigger rings get bigger text and smaller rings
        // get smaller text, always leaving room between the digits and the
        // stroke. "100%" is one character longer than "0"-"99%", so it uses
        // a slightly smaller fraction to read as the same visual size
        // instead of looking cramped against the ring.
        val ringDiameter = maxWidth
        val density = LocalDensity.current
        val fontSizeFraction = if (text.length >= 4) 0.20f else 0.24f
        val fontSize = with(density) { (ringDiameter * fontSizeFraction).toSp() }

        CircularProgressIndicator(
            progress = { 1f },
            modifier = Modifier.fillMaxSize(),
            color = trackColor,
            strokeWidth = strokeWidth,
        )
        CircularProgressIndicator(
            progress = { clampedPercent / 100f },
            modifier = Modifier.fillMaxSize(),
            color = ringColor,
            strokeWidth = strokeWidth,
        )
        Text(
            text = text,
            style = TextStyle(
                fontSize = fontSize,
                lineHeight = fontSize,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
            ),
            color = Color.Black,
        )
    }
}

/**
 * Small rounded pill used for status badges (Online/Offline, Synced/Syncing,
 * "Works Offline").
 */
@Composable
fun StatusPill(
    text: String,
    icon: ImageVector,
    containerColor: Color,
    contentColor: Color,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .background(containerColor, RoundedCornerShape(50))
            .padding(horizontal = 10.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = contentColor,
            modifier = Modifier.size(14.dp),
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = contentColor,
        )
    }
}

/**
 * Small stat box (Total/Present/Absent) reused across the attendance results
 * and attendance logs screens.
 */
@Composable
fun StatTile(
    icon: ImageVector,
    value: String,
    label: String,
    containerColor: Color,
    contentColor: Color,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .background(containerColor, RoundedCornerShape(12.dp))
            .padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(imageVector = icon, contentDescription = null, tint = contentColor)
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = contentColor,
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = contentColor,
        )
    }
}

/**
 * Consistently styled rounded search field with a leading search icon.
 */
@Composable
fun AppSearchField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = { Text(placeholder) },
        leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null, tint = Color.Black) },
        singleLine = true,
        shape = RoundedCornerShape(12.dp),
        modifier = modifier.fillMaxWidth(),
        colors = OutlinedTextFieldDefaults.colors(
            focusedTextColor = Color.Black,
            unfocusedTextColor = Color.Black,
            focusedLabelColor = Color.Black,
            unfocusedLabelColor = Color.Gray,
            cursorColor = Color.Black,
        ),
    )
}
