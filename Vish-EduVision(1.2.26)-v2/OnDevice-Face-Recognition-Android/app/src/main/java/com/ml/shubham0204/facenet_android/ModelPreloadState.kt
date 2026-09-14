package com.ml.shubham0204.facenet_android

import kotlinx.coroutines.flow.MutableStateFlow

object ModelPreloadState {
    val isReady = MutableStateFlow(false)
}
