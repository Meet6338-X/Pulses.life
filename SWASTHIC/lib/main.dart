import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

// Core imports
import 'core/theme/app_theme.dart';
import 'core/routes/app_routes.dart';
import 'core/state/app_state.dart';

// Screen imports
import 'screens/splash/splash_screen.dart';
import 'screens/language/language_selection_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/privacy/privacy_consent_screen.dart';
import 'screens/onboarding/user_context_screen.dart';
import 'screens/onboarding/onboarding_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';
import 'screens/dashboard/city_health_dashboard_screen.dart';
import 'screens/symptoms/select_symptoms_screen.dart';
import 'screens/symptoms/symptom_details_screen.dart';
import 'screens/symptoms/ai_guidance_screen.dart';
import 'screens/symptoms/symptom_history_screen.dart';
import 'screens/habits/health_habits_screen.dart';
import 'screens/alerts/health_alerts_screen.dart';
import 'screens/schemes/government_schemes_screen.dart';
import 'screens/emergency/emergency_request_screen.dart';
import 'screens/emergency/ambulance_tracking_screen.dart';
import 'screens/insights/personal_insights_screen.dart';
import 'screens/profile/user_profile_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set preferred orientations
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
  
  runApp(const SwasthicApp());
}

class SwasthicApp extends StatelessWidget {
  const SwasthicApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => AppState()..initializeDemoData(),
      child: MaterialApp(
        title: 'SWASTHIC',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        initialRoute: AppRoutes.splash,
        routes: {
          AppRoutes.splash: (context) => const SplashScreen(),
          AppRoutes.languageSelection: (context) => const LanguageSelectionScreen(),
          AppRoutes.login: (context) => const LoginScreen(),
          AppRoutes.privacy: (context) => const PrivacyConsentScreen(),
          AppRoutes.userContext: (context) => const UserContextScreen(),
          AppRoutes.onboarding: (context) => const OnboardingScreen(),
          AppRoutes.dashboard: (context) => const DashboardScreen(),
          AppRoutes.cityHealthDashboard: (context) => const CityHealthDashboardScreen(),
          AppRoutes.selectSymptoms: (context) => const SelectSymptomsScreen(),
          AppRoutes.symptomDetails: (context) => const SymptomDetailsScreen(),
          AppRoutes.aiGuidance: (context) => const AIGuidanceScreen(),
          AppRoutes.symptomHistory: (context) => const SymptomHistoryScreen(),
          AppRoutes.healthHabits: (context) => const HealthHabitsScreen(),
          AppRoutes.healthAlerts: (context) => const HealthAlertsScreen(),
          AppRoutes.governmentSchemes: (context) => const GovernmentSchemesScreen(),
          AppRoutes.emergencyRequest: (context) => const EmergencyRequestScreen(),
          AppRoutes.ambulanceTracking: (context) => const AmbulanceTrackingScreen(),
          AppRoutes.personalInsights: (context) => const PersonalInsightsScreen(),
          AppRoutes.profile: (context) => const UserProfileScreen(),
        },
      ),
    );
  }
}
