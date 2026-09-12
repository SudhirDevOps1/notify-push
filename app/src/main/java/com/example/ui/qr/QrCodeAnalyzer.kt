package com.example.ui.qr

import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.zxing.BarcodeFormat
import com.google.zxing.BinaryBitmap
import com.google.zxing.DecodeHintType
import com.google.zxing.MultiFormatReader
import com.google.zxing.PlanarYUVLuminanceSource
import com.google.zxing.common.HybridBinarizer

class QrCodeAnalyzer(
    private val onQrCodeScanned: (String) -> Unit
) : ImageAnalysis.Analyzer {

    private val reader = MultiFormatReader().apply {
        setHints(
            mapOf(
                DecodeHintType.POSSIBLE_FORMATS to listOf(BarcodeFormat.QR_CODE),
                DecodeHintType.TRY_HARDER to true,
                DecodeHintType.CHARACTER_SET to "UTF-8"
            )
        )
    }

    private var isScanning = true

    fun resumeScanning() {
        isScanning = true
    }

    fun pauseScanning() {
        isScanning = false
    }

    override fun analyze(imageProxy: ImageProxy) {
        if (!isScanning) {
            imageProxy.close()
            return
        }

        try {
            val plane = imageProxy.planes[0]
            val buffer = plane.buffer
            val rowStride = plane.rowStride
            val pixelStride = plane.pixelStride
            val width = imageProxy.width
            val height = imageProxy.height

            val yData = ByteArray(width * height)
            for (row in 0 until height) {
                val rowStart = row * rowStride
                for (col in 0 until width) {
                    yData[row * width + col] = buffer.get(rowStart + col * pixelStride)
                }
            }

            val source = PlanarYUVLuminanceSource(
                yData,
                width,
                height,
                0,
                0,
                width,
                height,
                false
            )

            val binaryBitmap = BinaryBitmap(HybridBinarizer(source))
            val result = reader.decodeWithState(binaryBitmap)

            if (result != null && result.text.isNotBlank()) {
                isScanning = false
                onQrCodeScanned(result.text)
            }
        } catch (_: Exception) {
            // Decoding failed for current frame; continue scanning
        } finally {
            reader.reset()
            imageProxy.close()
        }
    }
}
