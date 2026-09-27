package com.eduvision.attendance

import android.app.Application
import android.util.Log
import com.eduvision.attendance.data.ObjectBoxStore
import com.eduvision.attendance.di.AppModule
import com.eduvision.attendance.domain.embeddings.FaceNet
import com.eduvision.attendance.domain.face_detection.BaseFaceDetector
import com.eduvision.attendance.domain.face_detection.FaceSpoofDetector
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.koin.android.ext.koin.androidContext
import org.koin.core.component.KoinComponent
import org.koin.core.component.get
import org.koin.core.context.startKoin
import org.koin.ksp.generated.module
import kotlin.time.measureTime

class MainApplication : Application(), KoinComponent {
    override fun onCreate() {
        super.onCreate()
        startKoin {
            androidContext(this@MainApplication)
            modules(AppModule().module)
        }
        ObjectBoxStore.init(this)

        CoroutineScope(Dispatchers.Default).launch {
            try {
                val totalPreloadTime = measureTime {
                    val faceNetTime = measureTime { get<FaceNet>() }
                    Log.d("EduVisionTiming", "FaceNet resolved in: $faceNetTime")

                    val spoofTime = measureTime { get<FaceSpoofDetector>() }
                    Log.d("EduVisionTiming", "FaceSpoofDetector resolved in: $spoofTime")

                    val detectorTime = measureTime { get<BaseFaceDetector>() }
                    Log.d("EduVisionTiming", "BaseFaceDetector resolved in: $detectorTime")
                }
                Log.d("EduVisionTiming", "Total models preload time: $totalPreloadTime (Splash duration: ~$totalPreloadTime)")
            } catch (e: Exception) {
                Log.e("EduVisionTiming", "Model preload failed", e)
            } finally {
                ModelPreloadState.isReady.value = true
            }
        }
    }
}
