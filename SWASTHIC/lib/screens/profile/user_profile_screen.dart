import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/state/app_state.dart';
import '../../core/routes/app_routes.dart';

class UserProfileScreen extends StatelessWidget {
  const UserProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundWhite,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back),
                      onPressed: () {
                        Navigator.pop(context);
                      },
                    ),
                    const Text(
                      'Profile',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: () {
                        // Implement edit functionality
                      },
                      child: const Text('Edit', style: TextStyle(color: AppColors.primaryGreen)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              // Profile Info
              Consumer<AppState>(
                builder: (context, appState, child) {
                  final user = appState.userProfile;
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 50,
                          backgroundColor: AppColors.primaryGreen.withOpacity(0.1),
                          child: const Icon(Icons.person, size: 50, color: AppColors.primaryGreen),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          user?.isGuest == true ? 'Guest User' : (user?.phoneNumber ?? 'Unknown User'),
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${user?.ageGroup ?? 'Age Not Set'} • ${user?.gender ?? 'Gender Not Set'}',
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 24),
                        // Details Cards
                        _buildProfileCard(
                          icon: Icons.location_on,
                          title: 'Location',
                          value: '${user?.ward ?? 'Unknown Ward'}, ${appState.currentCity}',
                        ),
                        const SizedBox(height: 12),
                        _buildProfileCard(
                          icon: Icons.language,
                          title: 'Language',
                          value: appState.selectedLanguage == 'en' ? 'English' : appState.selectedLanguage,
                        ),
                        const SizedBox(height: 24),
                        // Actions
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              appState.logout();
                              Navigator.pushNamedAndRemoveUntil(context, AppRoutes.login, (route) => false);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.alertRed.withOpacity(0.1),
                              foregroundColor: AppColors.alertRed,
                              elevation: 0,
                            ),
                            child: const Text('Logout'),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileCard({
    required IconData icon,
    required String title,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primaryGreen),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
