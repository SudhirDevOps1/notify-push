package com.example

import com.example.ui.qr.QrCodeParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class QrCodeParserTest {

    @Test
    fun parsePlainTopicName() {
        val config = QrCodeParser.parse("my-website-alerts-1234")
        assertNotNull(config)
        assertEquals("my-website-alerts-1234", config?.topic)
        assertEquals(null, config?.serverUrl)
        assertEquals(null, config?.token)
    }

    @Test
    fun parseFullNtfyUrl() {
        val config = QrCodeParser.parse("https://ntfy.sh/vercel-nextjs-alerts")
        assertNotNull(config)
        assertEquals("vercel-nextjs-alerts", config?.topic)
        assertEquals("https://ntfy.sh", config?.serverUrl)
        assertEquals(null, config?.token)
    }

    @Test
    fun parseUrlWithAuthToken() {
        val config = QrCodeParser.parse("https://ntfy.mydomain.com:8443/orders?auth=tk_secret_123")
        assertNotNull(config)
        assertEquals("orders", config?.topic)
        assertEquals("https://ntfy.mydomain.com:8443", config?.serverUrl)
        assertEquals("tk_secret_123", config?.token)
    }

    @Test
    fun parseJsonConfiguration() {
        val json = """{"server":"https://ntfy.sh","topic":"production-cron","token":"tk_secure"}"""
        val config = QrCodeParser.parse(json)
        assertNotNull(config)
        assertEquals("production-cron", config?.topic)
        assertEquals("https://ntfy.sh", config?.serverUrl)
        assertEquals("tk_secure", config?.token)
    }

    @Test
    fun parseNtfyCustomScheme() {
        val config = QrCodeParser.parse("ntfy://ntfy.sh/my-react-app")
        assertNotNull(config)
        assertEquals("my-react-app", config?.topic)
        assertEquals("https://ntfy.sh", config?.serverUrl)
    }
}
