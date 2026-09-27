/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

package com.eduvision.attendance.presentation.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.eduvision.attendance.data.PersonRecord

data class StudentResult(
    val person: PersonRecord,
    val isPresent: Boolean,
    val isManual: Boolean = false,
)

/**
 * Shared attendance-result row — used by both the Attendance Logs and
 * Attendance Results screens so their per-student rows stay visually
 * consistent.
 *
 * When [onToggle] is provided, the status chip is tappable for manual correction.
 */
@Composable
fun ResultItem(
    result: StudentResult,
    onToggle: (() -> Unit)? = null
) {
    val containerColor = if (result.isPresent) Color(0xFFE8F5E9) else Color(0xFFFFEBEE)
    val contentColor = if (result.isPresent) Color(0xFF2E7D32) else Color(0xFFC62828)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .then(
                if (onToggle != null) Modifier.clickable { onToggle() } else Modifier
            ),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, contentColor.copy(alpha = 0.3f))
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Initials avatar — same style as the Students screen
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(Color.White, RoundedCornerShape(20.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = result.person.personName.take(1).uppercase(),
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = contentColor,
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = result.person.personName,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.Black
                    )
                    if (result.isManual) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Box(
                            modifier = Modifier
                                .background(Color(0xFFFFF3E0), RoundedCornerShape(4.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "MANUAL",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = Color(0xFFEF6C00)
                            )
                        }
                    }
                }
                Text(
                    text = "Roll No: ${result.person.rollNumber}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Black
                )
            }

            Box(
                modifier = Modifier
                    .then(
                        if (onToggle != null) Modifier.clip(RoundedCornerShape(6.dp)).clickable { onToggle() }
                        else Modifier
                    )
                    .background(contentColor, RoundedCornerShape(6.dp))
                    .padding(horizontal = 10.dp, vertical = 6.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = if (result.isPresent) "PRESENT" else "ABSENT",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = Color.White
                    )
                    if (onToggle != null) {
                        Spacer(modifier = Modifier.width(4.dp))
                        Icon(
                            imageVector = Icons.Filled.Edit,
                            contentDescription = "Tap to toggle",
                            tint = Color.White.copy(alpha = 0.85f),
                            modifier = Modifier.size(12.dp)
                        )
                    }
                }
            }
        }
    }
}

