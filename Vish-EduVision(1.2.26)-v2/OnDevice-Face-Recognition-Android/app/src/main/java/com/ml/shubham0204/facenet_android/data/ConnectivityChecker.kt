package com.ml.shubham0204.facenet_android.data

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import org.koin.core.annotation.Single

/**
 * Shared online/offline check backed by [ConnectivityManager]. Extracted as
 * a single utility so any screen needing a connectivity signal (attendance
 * sync status, home screen, etc.) can reuse the same logic.
 */
@Single
class ConnectivityChecker(private val context: Context) {
    fun isOnline(): Boolean {
        val connectivityManager =
            context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
                ?: return false
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
}
