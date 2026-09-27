package com.eduvision.attendance.di

import android.content.Context
import com.eduvision.attendance.domain.face_detection.BaseFaceDetector
import com.eduvision.attendance.domain.face_detection.MLKitFaceDetector
import com.eduvision.attendance.domain.face_detection.MediapipeFaceDetector
import org.koin.core.annotation.ComponentScan
import org.koin.core.annotation.Module
import org.koin.core.annotation.Single

@Module
@ComponentScan("com.eduvision.attendance")
class AppModule {

    private var isMLKit = true

    @Single
    fun provideFaceDetector(context: Context): BaseFaceDetector = if (isMLKit) {
        MLKitFaceDetector(context)
    } else {
        MediapipeFaceDetector(context)
    }
}
