import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class AppState extends ChangeNotifier {
  // User Profile
  UserProfile? _userProfile;
  UserProfile? get userProfile => _userProfile;
  
  // Language
  String _selectedLanguage = 'en';
  String get selectedLanguage => _selectedLanguage;
  
  // Auth State
  bool _isLoggedIn = false;
  bool get isLoggedIn => _isLoggedIn;
  
  // Consent
  bool _consentAccepted = false;
  bool get consentAccepted => _consentAccepted;
  
  // Onboarding
  bool _onboardingComplete = false;
  bool get onboardingComplete => _onboardingComplete;
  
  // Selected Symptoms
  List<Symptom> _selectedSymptoms = [];
  List<Symptom> get selectedSymptoms => _selectedSymptoms;
  
  // Health Alerts
  List<HealthAlert> _healthAlerts = [];
  List<HealthAlert> get healthAlerts => _healthAlerts;
  
  // Health Habits
  List<HealthHabit> _healthHabits = [];
  List<HealthHabit> get healthHabits => _healthHabits;
  
  // Government Schemes
  List<GovernmentScheme> _governmentSchemes = [];
  List<GovernmentScheme> get governmentSchemes => _governmentSchemes;
  
  // Symptom History
  List<Symptom> _symptomHistory = [];
  List<Symptom> get symptomHistory => _symptomHistory;
  
  // Current Ward/Area
  String _currentWard = 'Shivajinagar';
  String get currentWard => _currentWard;
  
  String _currentCity = 'Pune';
  String get currentCity => _currentCity;
  
  // Emergency State
  bool _isEmergencyActive = false;
  bool get isEmergencyActive => _isEmergencyActive;
  
  String _emergencyType = '';
  String get emergencyType => _emergencyType;
  
  // Methods
  void setLanguage(String language) {
    _selectedLanguage = language;
    notifyListeners();
  }
  
  void setUserProfile(UserProfile profile) {
    _userProfile = profile;
    notifyListeners();
  }
  
  void login({String? phoneNumber, bool asGuest = false}) {
    _isLoggedIn = true;
    if (asGuest) {
      _userProfile = UserProfile(isGuest: true);
    } else if (phoneNumber != null) {
      _userProfile = UserProfile(phoneNumber: phoneNumber);
    }
    notifyListeners();
  }
  
  void logout() {
    _isLoggedIn = false;
    _userProfile = null;
    _consentAccepted = false;
    _onboardingComplete = false;
    _selectedSymptoms = [];
    notifyListeners();
  }
  
  void acceptConsent() {
    _consentAccepted = true;
    notifyListeners();
  }
  
  void completeOnboarding() {
    _onboardingComplete = true;
    notifyListeners();
  }
  
  void updateUserContext({String? ageGroup, String? gender, String? ward}) {
    if (_userProfile != null) {
      _userProfile = _userProfile!.copyWith(
        ageGroup: ageGroup,
        gender: gender,
        ward: ward,
      );
    } else {
      _userProfile = UserProfile(
        ageGroup: ageGroup,
        gender: gender,
        ward: ward,
      );
    }
    if (ward != null) {
      _currentWard = ward;
    }
    notifyListeners();
  }
  
  void addSymptom(Symptom symptom) {
    _selectedSymptoms.add(symptom);
    notifyListeners();
  }
  
  void removeSymptom(String symptomId) {
    _selectedSymptoms.removeWhere((s) => s.id == symptomId);
    notifyListeners();
  }
  
  void updateSymptom(Symptom symptom) {
    final index = _selectedSymptoms.indexWhere((s) => s.id == symptom.id);
    if (index != -1) {
      _selectedSymptoms[index] = symptom;
      notifyListeners();
    }
  }
  
  void clearSymptoms() {
    _selectedSymptoms = [];
    notifyListeners();
  }
  
  void submitSymptomReport() {
    // Add to history with current timestamp
    for (var symptom in _selectedSymptoms) {
      _symptomHistory.add(symptom.copyWith(recordedAt: DateTime.now()));
    }
    notifyListeners();
  }
  
  void requestEmergency(String type) {
    _isEmergencyActive = true;
    _emergencyType = type;
    notifyListeners();
  }
  
  void cancelEmergency() {
    _isEmergencyActive = false;
    _emergencyType = '';
    notifyListeners();
  }

  // API Integration
  final ApiService _apiService = ApiService();

  Future<void> refreshHealthAlerts() async {
    try {
      // Simulate API call
      // final data = await _apiService.get('alerts');
      // For now, we keep the demo data
      await Future.delayed(const Duration(seconds: 1));
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching alerts: $e');
    }
  }
  
  void initializeDemoData() {
    // Initialize with demo health alerts
    _healthAlerts = [
      HealthAlert(
        id: '1',
        title: 'Dengue Cases Rising in Your Area',
        description: 'Health dept reports a 15% increase in cases within 2km of your location. Stay alert.',
        type: 'HIGH_PRIORITY',
        priority: 'high',
        createdAt: DateTime.now().subtract(const Duration(minutes: 12)),
      ),
      HealthAlert(
        id: '2',
        title: 'New Vaccination Drive: Sector 5',
        description: 'Official health department update regarding free booster clinics starting next Monday.',
        type: 'GOVERNMENT_UPDATE',
        priority: 'medium',
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
      ),
      HealthAlert(
        id: '3',
        title: 'Water Contamination Advisory',
        description: 'Precautionary boil water notice for the North District due to main repairs.',
        type: 'AREA_ALERT',
        priority: 'high',
        createdAt: DateTime.now().subtract(const Duration(hours: 4)),
      ),
      HealthAlert(
        id: '4',
        title: 'Daily Symptom Log Reminder',
        description: 'Don\'t forget to update your daily health status to help community tracking.',
        type: 'DAILY_REMINDER',
        priority: 'low',
        createdAt: DateTime.now().subtract(const Duration(days: 1)),
      ),
    ];
    
    // Initialize with demo health habits
    _healthHabits = [
      HealthHabit(
        id: '1',
        name: 'Water Intake',
        icon: 'water',
        targetValue: 2.5,
        currentValue: 1.8,
        unit: 'L',
      ),
      HealthHabit(
        id: '2',
        name: 'Sleep Duration',
        icon: 'sleep',
        targetValue: 8,
        currentValue: 7.5,
        unit: 'hours',
        isCompleted: true,
      ),
      HealthHabit(
        id: '3',
        name: 'Morning Exercise',
        icon: 'exercise',
        targetValue: 1,
        currentValue: 0,
        unit: 'session',
      ),
      HealthHabit(
        id: '4',
        name: 'Healthy Meals',
        icon: 'food',
        targetValue: 3,
        currentValue: 2,
        unit: 'meals',
      ),
    ];
    
    // Initialize with demo government schemes
    _governmentSchemes = [
      GovernmentScheme(
        id: '1',
        title: 'Ayushman Bharat (PM-JAY)',
        description: 'Provides health insurance cover of ₹5 lakhs per family per year for secondary and tertiary care hospitalization.',
        category: 'INSURANCE',
        isEligible: true,
      ),
      GovernmentScheme(
        id: '2',
        title: 'Janani Suraksha Yojana',
        description: 'Safe motherhood intervention under NHM providing cash assistance for institutional delivery among poor pregnant women.',
        category: 'MATERNAL',
        isEligible: true,
      ),
      GovernmentScheme(
        id: '3',
        title: 'PM Jan Aushadhi Kendra',
        description: 'Availability of quality generic medicines at much lower prices than the market through specialized kendras.',
        category: 'MEDICINES',
        needsVerification: true,
      ),
      GovernmentScheme(
        id: '4',
        title: 'Varishtha Pension Bima',
        description: 'A pension scheme for senior citizens providing social security and health expenditure support via monthly payments.',
        category: 'SENIOR_CITIZENS',
        isEligible: true,
      ),
    ];
    
    // Initialize demo symptom history
    _symptomHistory = [
      Symptom(
        id: 'h1',
        name: 'Fever',
        category: 'Fever',
        severity: 4,
        duration: '1 day',
        recordedAt: DateTime(2023, 10, 5, 8, 30),
      ),
      Symptom(
        id: 'h2',
        name: 'Persistent Cough',
        category: 'Respiratory',
        severity: 3,
        duration: '2-3 days',
        recordedAt: DateTime(2023, 10, 5, 9, 15),
      ),
    ];
    
    notifyListeners();
  }
}
