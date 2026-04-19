package me.chordmini.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF0066CC),
    onPrimary = Color.White,
    primaryContainer = Color(0xFF0052A3),
    onPrimaryContainer = Color(0xFFB3D9FF),
    secondary = Color(0xFF646464),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE8DFFE),
    onSecondaryContainer = Color(0xFF1E192B),
    tertiary = Color(0xFF7D5260),
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFFFD8E4),
    onTertiaryContainer = Color(0xFF31111D),
    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6),
    background = Color(0xFF1E252E),
    onBackground = Color(0xFFE2E8F0),
    surface = Color(0xFF2C3E50),
    onSurface = Color(0xFFCAD0D8),
    surfaceVariant = Color(0xFF49454E),
    onSurfaceVariant = Color(0xFFCAC7D0),
)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF0066CC),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD9E7FF),
    onPrimaryContainer = Color(0xFF001B54),
    secondary = Color(0xFF646464),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE8DFFE),
    onSecondaryContainer = Color(0xFF1E192B),
    tertiary = Color(0xFF7D5260),
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFFFD8E4),
    onTertiaryContainer = Color(0xFF31111D),
    error = Color(0xFFB3261E),
    onError = Color.White,
    errorContainer = Color(0xFFF9DEDC),
    onErrorContainer = Color(0xFF410E0B),
    background = Color(0xFFFAFBFC),
    onBackground = Color(0xFF1C1C1C),
    surface = Color(0xFFFEFBFF),
    onSurface = Color(0xFF1C1C1C),
    surfaceVariant = Color(0xFFE7E0EC),
    onSurfaceVariant = Color(0xFF49454E),
)

@Composable
fun ChordMiniTheme(
    darkTheme: Boolean = true, // Default to dark theme
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
