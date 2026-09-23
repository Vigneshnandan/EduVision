package com.eduvision.attendance

import kotlinx.coroutines.flow.MutableStateFlow

object ModelPreloadState {
    val isReady = MutableStateFlow(false)
}
