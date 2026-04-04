# SWASTHIC - City Health Intelligence Platform

A comprehensive mobile application for city-wide health monitoring, symptom tracking, and emergency response.

## Features Implemented

### Core Features
- **Splash Screen**: Animated introduction with branding.
- **Language Selection**: Multi-language support (EN, HI, MR, KA).
- **Authentication**: Login with phone number and guest access.
- **User Profile**: Manage personal details and settings.

### Health Dashboard
- **City Health Dashboard**: Real-time health stats, trending symptoms, and heatmaps.
- **Personal Insights**: Health score, symptom analysis, and weekly activity tracking.
- **Ward Status**: View health risk levels for your specific ward.
- **Environmental Risk**: Monitoring of environmental factors like AQI.

### Symptom Tracking
- **Symptom Reporting**: Easy-to-use interface for selecting and reporting symptoms.
- **Symptom History**: Calendar and list views of past symptoms with severity tracking.
- **AI Guidance**: Immediate recommendations based on reported symptoms.

### Emergency Response
- **Emergency Request Hub**: One-tap SOS and categorized emergency requests.
- **Ambulance Tracking**: Live tracking of dispatched ambulances with ETA.

### Additional Features
- **Health Habits**: Track daily habits like water intake and sleep.
- **Health Alerts**: Receive critical health updates and government notifications.
- **Government Schemes**: Browse and check eligibility for health schemes.

## Technical Architecture

- **Framework**: Flutter (Material 3 Design)
- **State Management**: Provider (ChangeNotifier based architecture)
- **Navigation**: Named routes with a centralized route manager.
- **API Integration**: Placeholder service ready for backend connection (Base URL: `https://api.swasthic.gov.in`).
- **Data Models**: Structured models for User, Symptoms, Alerts, etc.

## Getting Started

1.  **Dependencies**: Run `flutter pub get` to install required packages.
2.  **Run**: execute `flutter run` to start the application on your connected device or emulator.

## License

Private and Confidential - SWASTHIC Project.
