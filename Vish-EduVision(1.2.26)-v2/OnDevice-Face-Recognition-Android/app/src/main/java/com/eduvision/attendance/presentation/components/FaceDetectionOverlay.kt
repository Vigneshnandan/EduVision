package com.eduvision.attendance.presentation.components

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.RectF
import android.view.SurfaceHolder
import android.view.SurfaceView
import android.widget.FrameLayout
import androidx.camera.core.AspectRatio
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.core.graphics.toRectF
import androidx.core.view.doOnLayout
import androidx.lifecycle.LifecycleOwner
import com.eduvision.attendance.presentation.screens.detect_screen.DetectScreenViewModel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.Executors
import androidx.core.graphics.createBitmap

@SuppressLint("ViewConstructor")
@ExperimentalGetImage
class FaceDetectionOverlay(
    private val lifecycleOwner: LifecycleOwner,
    private val context: Context,
    private val viewModel: DetectScreenViewModel,
) : FrameLayout(context) {
    // Setting `flatSearch` to `true` enables precise calculation
    // of cosine similarity.
    // This is slower than ObjectBox's vector search, which approximates
    // nearest neighbor search
    private val flatSearch: Boolean = false
    
    private val colorScanning = Color.parseColor("#4DFFFF00") 
    private val colorSuccess = Color.parseColor("#4D00FF00")
    private val colorError = Color.parseColor("#4DFF0000")

    private var overlayWidth: Int = 0
    private var overlayHeight: Int = 0
    
    // Robust Validation State
    private val consecutiveDetectionCounts = mutableMapOf<Long, Int>()
    private val FRAME_THRESHOLD = 6 // Approx 150-300ms at 30fps. Adjustable.

    private var imageTransform: Matrix = Matrix()
    private var boundingBoxTransform: Matrix = Matrix()
    private var isImageTransformedInitialized = false
    private var isBoundingBoxTransformedInitialized = false

    private lateinit var frameBitmap: Bitmap
    private var isProcessing = false
    private var cameraFacing: Int? = null
    private lateinit var boundingBoxOverlay: BoundingBoxOverlay
    private lateinit var previewView: PreviewView

    var predictions: Array<Prediction> = arrayOf()

    init {
        doOnLayout {
            overlayHeight = it.measuredHeight
            overlayWidth = it.measuredWidth
        }
    }

    fun initializeCamera(cameraFacing: Int) {
        this.cameraFacing = cameraFacing
        this.isImageTransformedInitialized = false
        this.isBoundingBoxTransformedInitialized = false
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        val previewView = PreviewView(context)
        val executor = ContextCompat.getMainExecutor(context)
        cameraProviderFuture.addListener(
            {
                val cameraProvider = cameraProviderFuture.get()
                val preview =
                    Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }
                val cameraSelector =
                    CameraSelector.Builder().requireLensFacing(cameraFacing).build()
                val frameAnalyzer =
                    ImageAnalysis
                        .Builder()
                        .setTargetAspectRatio(AspectRatio.RATIO_16_9)
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
                        .build()
                frameAnalyzer.setAnalyzer(Executors.newSingleThreadExecutor(), analyzer)
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    preview,
                    frameAnalyzer,
                )
            },
            executor,
        )
        if (childCount == 2) {
            removeView(this.previewView)
            removeView(this.boundingBoxOverlay)
        }
        this.previewView = previewView
        addView(this.previewView)

        val boundingBoxOverlayParams =
            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        this.boundingBoxOverlay = BoundingBoxOverlay(context)
        this.boundingBoxOverlay.setWillNotDraw(false)
        this.boundingBoxOverlay.setZOrderOnTop(true)
        addView(this.boundingBoxOverlay, boundingBoxOverlayParams)
    }

    private val analyzer =
        ImageAnalysis.Analyzer { image ->
            if (isProcessing) {
                image.close()
                return@Analyzer
            }
            isProcessing = true

            try {
                // Use CameraX built-in toBitmap() which handles row stride, pixel stride, format conversion correctly
                frameBitmap = image.toBitmap()

                // Configure frameHeight and frameWidth for output2overlay transformation matrix
                // and apply it to `frameBitmap`
                if (!isImageTransformedInitialized) {
                    imageTransform = Matrix()
                    imageTransform.apply { postRotate(image.imageInfo.rotationDegrees.toFloat()) }
                    isImageTransformedInitialized = true
                }
                frameBitmap =
                    Bitmap.createBitmap(
                        frameBitmap,
                        0,
                        0,
                        frameBitmap.width,
                        frameBitmap.height,
                        imageTransform,
                        false,
                    )

                if (!isBoundingBoxTransformedInitialized) {
                    boundingBoxTransform = Matrix()
                    boundingBoxTransform.apply {
                        setScale(
                            overlayWidth / frameBitmap.width.toFloat(),
                            overlayHeight / frameBitmap.height.toFloat(),
                        )
                        if (cameraFacing == CameraSelector.LENS_FACING_FRONT) {
                            // Mirror the bounding box coordinates
                            // for front-facing camera
                            postScale(
                                -1f,
                                1f,
                                overlayWidth.toFloat() / 2.0f,
                                overlayHeight.toFloat() / 2.0f,
                            )
                        }
                    }
                    isBoundingBoxTransformedInitialized = true
                }
                CoroutineScope(Dispatchers.Default).launch {
                    try {
                        val predictions = ArrayList<Prediction>()
                        val (metrics, results) =
                            viewModel.imageVectorUseCase.getNearestPersonName(
                                frameBitmap,
                                flatSearch,
                                viewModel.subsetPersonIDs
                            )

                        // Validation Logic: Track consecutive frames
                        val currentFrameIds = results.mapNotNull { it.personID }.toSet()
                        val iterator = consecutiveDetectionCounts.iterator()
                        while (iterator.hasNext()) {
                            val entry = iterator.next()
                            if (entry.key !in currentFrameIds) {
                                iterator.remove()
                            }
                        }

                        results.forEach { (name, boundingBox, spoofResult, personID) ->
                            val box = boundingBox.toRectF()
                            var personName = name
                            var boxColor = colorScanning
                            val isSpoofed = spoofResult != null && spoofResult.isSpoof

                            if (viewModel.getNumPeople().toInt() == 0) {
                                personName = ""
                            }

                            if (personID != null && personName != "Not recognized" && viewModel.studentClass.isNotEmpty()) {
                                if (isSpoofed) {
                                    consecutiveDetectionCounts[personID] = 0
                                    boxColor = colorError
                                    personName = "$personName (Spoof detected)"
                                } else {
                                    val count = (consecutiveDetectionCounts[personID] ?: 0) + 1
                                    consecutiveDetectionCounts[personID] = count

                                    // Trigger only when threshold is reached
                                    if (count == FRAME_THRESHOLD) {
                                        viewModel.markAttendance(personID, personName)
                                    }
                                    if (count < FRAME_THRESHOLD) {
                                        personName = ""
                                        boxColor = colorScanning
                                    } else {
                                        boxColor = colorSuccess
                                    }
                                }
                            } else if (isSpoofed) {
                                personName = "$personName (Spoof detected)"
                            }

                            boundingBoxTransform.mapRect(box)
                            predictions.add(Prediction(box, personName, boxColor))
                        }
                        withContext(Dispatchers.Main) {
                            viewModel.faceDetectionMetricsState.value = metrics
                            this@FaceDetectionOverlay.predictions = predictions.toTypedArray()
                            boundingBoxOverlay.invalidate()
                            isProcessing = false
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                        withContext(Dispatchers.Main) {
                            isProcessing = false
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                isProcessing = false
            } finally {
                image.close()
            }
        }

    data class Prediction(
        var bbox: RectF,
        var label: String,
        var color: Int
    )

    inner class BoundingBoxOverlay(
        context: Context,
    ) : SurfaceView(context),
        SurfaceHolder.Callback {
        private val boxPaint =
            Paint().apply {
                color = Color.parseColor("#4D90caf9")
                style = Paint.Style.FILL
            }
        private val textPaint =
            Paint().apply {
                strokeWidth = 2.0f
                textSize = 36f
                color = Color.WHITE
            }

        override fun surfaceCreated(holder: SurfaceHolder) {}

        override fun surfaceChanged(
            holder: SurfaceHolder,
            format: Int,
            width: Int,
            height: Int,
        ) {}

        override fun surfaceDestroyed(holder: SurfaceHolder) {}

        override fun onDraw(canvas: Canvas) {
            predictions.forEach {
                boxPaint.color = it.color
                canvas.drawRoundRect(it.bbox, 16f, 16f, boxPaint)
                canvas.drawText(it.label, it.bbox.centerX(), it.bbox.centerY(), textPaint)
            }
        }
    }
}
