package me.chordmini.data.remote

import kotlinx.serialization.Serializable
import okhttp3.OkHttpClient
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.URL
import java.util.concurrent.TimeUnit

@Serializable
data class BeatInfo(
    val time: Double,
    val confidence: Double? = null
)

@Serializable
data class ChordDetectionResult(
    val chord: String,
    val time: Double,
    val confidence: Double? = null
)

@Serializable
data class SynchronizedChord(
    val chord: String,
    val beatIndex: Int
)

@Serializable
data class AnalysisResponse(
    val videoId: String,
    val title: String,
    val channelTitle: String,
    val thumbnail: String,
    val beats: List<BeatInfo>,
    val chords: List<ChordDetectionResult>,
    val synchronizedChords: List<SynchronizedChord>,
    val timeSignature: Int? = null,
    val audioDuration: Double? = null
)

class BackendService(private val baseUrl: String = "http://localhost:8080") {
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()

    suspend fun analyzeAudio(videoId: String): AnalysisResponse = withContext(Dispatchers.IO) {
        val url = "$baseUrl/analyze?video_id=$videoId"
        val request = okhttp3.Request.Builder()
            .url(url)
            .get()
            .build()

        httpClient.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw Exception("Backend error: ${response.code}")
            }

            val body = response.body?.string() ?: throw Exception("Empty response")
            gson.fromJson(body, AnalysisResponse::class.java)
        }
    }

    suspend fun health(): Boolean = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/"
            val request = okhttp3.Request.Builder()
                .url(url)
                .get()
                .build()

            httpClient.newCall(request).execute().use { response ->
                response.isSuccessful
            }
        } catch (e: Exception) {
            false
        }
    }
}
