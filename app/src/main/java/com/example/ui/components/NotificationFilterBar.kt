package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.PriorityHigh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun NotificationFilterBar(
    searchQuery: String,
    onSearchQueryChange: (String) -> Unit,
    selectedPriority: Int?,
    onSelectPriority: (Int?) -> Unit,
    onlyWithLinks: Boolean,
    onToggleOnlyWithLinks: () -> Unit,
    totalCount: Int,
    filteredCount: Int,
    onClearFilters: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isFilterActive = searchQuery.isNotBlank() || selectedPriority != null || onlyWithLinks

    Column(modifier = modifier.fillMaxWidth()) {
        // Search Input Field
        OutlinedTextField(
            value = searchQuery,
            onValueChange = onSearchQueryChange,
            placeholder = { Text("Search by title, body, or tag...", fontSize = 14.sp) },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = "Search",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(20.dp)
                )
            },
            trailingIcon = {
                if (searchQuery.isNotEmpty()) {
                    IconButton(
                        onClick = { onSearchQueryChange("") },
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Clear,
                            contentDescription = "Clear search",
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            },
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                focusedContainerColor = MaterialTheme.colorScheme.surface
            ),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("notification_search_field")
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Horizontal Filter Chips Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // "All" chip
            FilterChip(
                selected = selectedPriority == null && !onlyWithLinks,
                onClick = {
                    onSelectPriority(null)
                    if (onlyWithLinks) onToggleOnlyWithLinks()
                },
                label = { Text("All", fontSize = 12.sp) }
            )

            // "High & Urgent (4+)" chip
            FilterChip(
                selected = selectedPriority == 4,
                onClick = { onSelectPriority(4) },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.PriorityHigh,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp)
                    )
                },
                label = { Text("High & Urgent", fontSize = 12.sp) }
            )

            // "With Link" chip
            FilterChip(
                selected = onlyWithLinks,
                onClick = onToggleOnlyWithLinks,
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Link,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp)
                    )
                },
                label = { Text("Has Link", fontSize = 12.sp) }
            )

            if (isFilterActive) {
                TextButton(
                    onClick = onClearFilters,
                    modifier = Modifier.padding(start = 4.dp)
                ) {
                    Text("Reset", fontSize = 12.sp, color = MaterialTheme.colorScheme.error)
                }
            }
        }

        // Filter result indicator if active
        AnimatedVisibility(visible = isFilterActive) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp, bottom = 2.dp)
            ) {
                Text(
                    text = "Showing $filteredCount of $totalCount alerts",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
