package com.eduvision.attendance.di

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Rect
import android.net.Uri
import com.eduvision.attendance.domain.face_detection.BaseFaceDetector
import com.eduvision.attendance.domain.face_detection.MLKitFaceDetector
import com.eduvision.attendance.domain.face_detection.MediapipeFaceDetector
import org.koin.core.annotation.ComponentScan
import org.koin.core.annotation.Module
import org.koin.core.annotation.Single

@Module
@ComponentScan("com.eduvision.attendance")
class AppModule {

    @Single
    fun provideFaceDetector(context: Context): BaseFaceDetector {
        val mediapipe = MediapipeFaceDetector(context)
        val mlKit = MLKitFaceDetector(context)
        return object : BaseFaceDetector() {
            override suspend fun getCroppedFace(imageUri: Uri): Result<Bitmap> {
                val mpResult = mediapipe.getCroppedFace(imageUri)
                if (mpResult.isSuccess) return mpResult
                return try {
                    mlKit.getCroppedFace(imageUri)
                } catch (e: Exception) {
                    mpResult
                }
            }

            override suspend fun getAllCroppedFaces(frameBitmap: Bitmap): List<Pair<Bitmap, Rect>> {
                return try {
                    val faces = mediapipe.getAllCroppedFaces(frameBitmap)
                    if (faces.isNotEmpty()) faces else mlKit.getAllCroppedFaces(frameBitmap)
                } catch (e: Exception) {
                    try {
                        mlKit.getAllCroppedFaces(frameBitmap)
                    } catch (e2: Exception) {
                        emptyList()
                    }
                }
            }
        }
    }
}
