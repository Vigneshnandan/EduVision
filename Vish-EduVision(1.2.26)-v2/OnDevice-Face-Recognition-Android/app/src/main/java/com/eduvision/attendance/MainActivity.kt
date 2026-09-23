package com.eduvision.attendance

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.eduvision.attendance.presentation.screens.add_face.AddFaceScreen
import com.eduvision.attendance.presentation.screens.detect_screen.DetectScreen
import com.eduvision.attendance.presentation.screens.face_list.FaceListScreen
import com.eduvision.attendance.presentation.screens.home.EduVisionHomeScreen
import com.eduvision.attendance.presentation.screens.result.AttendanceResultScreen
import com.eduvision.attendance.presentation.screens.log.AttendanceLogScreen
import com.eduvision.attendance.presentation.theme.EduVisionTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)
        splashScreen.setKeepOnScreenCondition {
            !ModelPreloadState.isReady.value
        }
        enableEdgeToEdge()
        setContent {
            EduVisionTheme {
                val navHostController = rememberNavController()
                NavHost(
                    navController = navHostController,
                    startDestination = "home",
                    enterTransition = { fadeIn() },
                    exitTransition = { fadeOut() },
                ) {
                    composable("home") {
                        EduVisionHomeScreen(
                            onNavigateToRegistration = { navHostController.navigate("add-face") },
                            onNavigateToAttendance = { navHostController.navigate("detect") },
                            onNavigateToStudentList = { navHostController.navigate("face-list") },
                            onNavigateToLogs = { navHostController.navigate("attendance-logs") }
                        )
                    }
                    composable("add-face") { AddFaceScreen { navHostController.navigateUp() } }
                    composable("attendance-logs") {
                        AttendanceLogScreen(onNavigateBack = { navHostController.navigateUp() })
                    }
                    composable("detect") {
                        DetectScreen(
                            onOpenFaceListClick = { navHostController.navigate("face-list") },
                            onAttendanceEnd = { className, date ->
                                navHostController.navigate("attendance-result/$className/$date")
                            }
                        )
                    }
                    composable("face-list") {
                        FaceListScreen(
                            onNavigateBack = { navHostController.navigateUp() },
                            onAddFaceClick = { navHostController.navigate("add-face") },
                        )
                    }
                    composable(
                        "attendance-result/{className}/{date}",
                        arguments = listOf(
                            navArgument("className") { type = NavType.StringType },
                            navArgument("date") { type = NavType.LongType }
                        )
                    ) { backStackEntry ->
                        val className = backStackEntry.arguments?.getString("className") ?: ""
                        val date = backStackEntry.arguments?.getLong("date") ?: 0L
                        AttendanceResultScreen(
                            studentClass = className,
                            date = date,
                            onNavigateHome = {
                                navHostController.navigate("home") {
                                    popUpTo("home") { inclusive = true }
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}
