package com.example.crypto

import android.util.Base64
import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

data class DecryptedPayload(
    val title: String? = null,
    val message: String,
    val tags: List<String>? = null,
    val clickUrl: String? = null
)

object E2eeHelper {

    private const val GCM_TAG_LENGTH_BITS = 128
    private const val IV_LENGTH_BYTES = 12

    /**
     * Derives a 256-bit AES key from a passphrase using SHA-256.
     */
    fun deriveKey(passphrase: String): SecretKeySpec {
        val digest = MessageDigest.getInstance("SHA-256")
        val keyBytes = digest.digest(passphrase.toByteArray(Charsets.UTF_8))
        return SecretKeySpec(keyBytes, "AES")
    }

    /**
     * Decrypts an incoming E2EE JSON envelope with the given passphrase.
     * Expects: { "_e2e": 1, "iv": "<base64>", "data": "<base64>" }
     * Returns DecryptedPayload on success, or null if authentication tag fails or passphrase is wrong.
     */
    fun decryptPayload(rawEnvelope: String, passphrase: String): DecryptedPayload? {
        if (passphrase.isBlank()) return null
        return try {
            val json = JSONObject(rawEnvelope.trim())
            if (!json.has("_e2e")) return null

            val ivBase64 = json.getString("iv")
            val dataBase64 = json.getString("data")

            val iv = Base64.decode(ivBase64, Base64.DEFAULT)
            val ciphertextWithTag = Base64.decode(dataBase64, Base64.DEFAULT)

            val secretKey = deriveKey(passphrase)
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            val spec = GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv)
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec)

            val plaintextBytes = cipher.doFinal(ciphertextWithTag)
            val plaintext = String(plaintextBytes, Charsets.UTF_8)

            // Try parsing inner JSON payload (title, message, tags, click)
            if (plaintext.trim().startsWith("{") && plaintext.trim().endsWith("}")) {
                val inner = JSONObject(plaintext.trim())
                val title = if (inner.has("title")) inner.getString("title") else null
                val msg = inner.optString("message", plaintext)
                val click = if (inner.has("click")) inner.getString("click") else null

                val tagsList = mutableListOf<String>()
                val tagsArr = inner.optJSONArray("tags")
                if (tagsArr != null) {
                    for (i in 0 until tagsArr.length()) {
                        tagsList.add(tagsArr.getString(i))
                    }
                }

                DecryptedPayload(
                    title = title,
                    message = msg,
                    tags = tagsList.takeIf { it.isNotEmpty() },
                    clickUrl = click
                )
            } else {
                DecryptedPayload(message = plaintext)
            }
        } catch (_: Exception) {
            null
        }
    }

    /**
     * Encrypts a message into an E2EE JSON envelope using AES-256-GCM.
     */
    fun encryptPayload(
        title: String?,
        message: String,
        tags: List<String>? = null,
        clickUrl: String? = null,
        passphrase: String
    ): String {
        val innerJson = JSONObject().apply {
            if (!title.isNullOrBlank()) put("title", title)
            put("message", message)
            if (!tags.isNullOrEmpty()) {
                val arr = JSONArray()
                tags.forEach { arr.put(it) }
                put("tags", arr)
            }
            if (!clickUrl.isNullOrBlank()) put("click", clickUrl)
        }

        val plaintextBytes = innerJson.toString().toByteArray(Charsets.UTF_8)
        val iv = ByteArray(IV_LENGTH_BYTES).also { SecureRandom().nextBytes(it) }

        val secretKey = deriveKey(passphrase)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val spec = GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv)
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec)

        val ciphertextWithTag = cipher.doFinal(plaintextBytes)

        return JSONObject().apply {
            put("_e2e", 1)
            put("iv", Base64.encodeToString(iv, Base64.NO_WRAP))
            put("data", Base64.encodeToString(ciphertextWithTag, Base64.NO_WRAP))
        }.toString()
    }
}
