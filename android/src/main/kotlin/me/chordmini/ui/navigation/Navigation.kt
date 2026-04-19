package me.chordmini.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import me.chordmini.ui.screens.AnalyzeScreen
import me.chordmini.ui.screens.FavoritesScreen
import me.chordmini.ui.screens.HomeScreen
import me.chordmini.ui.screens.PlaylistsScreen
import me.chordmini.ui.screens.SettingsScreen

sealed class Route(val route: String) {
    data object Home : Route("home")
    data object Analyze : Route("analyze")
    data object Favorites : Route("favorites")
    data object Playlists : Route("playlists")
    data object Settings : Route("settings")
}

@Composable
fun ChordMiniApp() {
    val navController = rememberNavController()
    
    NavHost(
        navController = navController,
        startDestination = Route.Home.route
    ) {
        composable(Route.Home.route) {
            HomeScreen(navController)
        }
        composable(Route.Analyze.route) {
            AnalyzeScreen(navController)
        }
        composable(Route.Favorites.route) {
            FavoritesScreen(navController)
        }
        composable(Route.Playlists.route) {
            PlaylistsScreen(navController)
        }
        composable(Route.Settings.route) {
            SettingsScreen(navController)
        }
    }
}
