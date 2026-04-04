import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/routes/app_routes.dart';
import '../../core/state/app_state.dart';

class UserContextScreen extends StatefulWidget {
  const UserContextScreen({super.key});

  @override
  State<UserContextScreen> createState() => _UserContextScreenState();
}

class _UserContextScreenState extends State<UserContextScreen> {
  String? _selectedAgeGroup;
  String? _selectedGender;
  final _wardController = TextEditingController();

  final List<String> _ageGroups = ['0-12', '13-18', '19-35', '36-64', '65+'];
  final List<Map<String, dynamic>> _genderOptions = [
    {'id': 'male', 'label': 'Male', 'icon': Icons.male},
    {'id': 'female', 'label': 'Female', 'icon': Icons.female},
    {'id': 'other', 'label': 'Other', 'icon': Icons.transgender},
  ];
  final List<String> _wardSuggestions = ['Indiranagar', 'Koramangala', 'Whitefield', 'Shivajinagar'];

  @override
  void dispose() {
    _wardController.dispose();
    super.dispose();
  }

  bool get _canContinue => _selectedAgeGroup != null && _selectedGender != null;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundWhite,
      body: SafeArea(
        child: Column(
          children: [
            // Skip Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () {
                      Navigator.pushNamed(context, AppRoutes.onboarding);
                    },
                    child: const Text(
                      'Skip',
                      style: TextStyle(
                        color: AppColors.primaryGreen,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),
                    // Title
                    const Text(
                      'Help Us Serve You Better',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'SAMVED-VAKR health intelligence uses these details to personalize your safety alerts.',
                      style: TextStyle(
                        fontSize: 15,
                        height: 1.5,
                        color: AppColors.textSecondary.withValues(alpha: 0.8),
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Privacy Notice
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.backgroundGreen.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            Icons.lock_outline,
                            size: 20,
                            color: AppColors.primaryGreen.withValues(alpha: 0.8),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Your information is anonymous',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Data is used solely for localized health alerts and improving city-wide emergency response.',
                                  style: TextStyle(
                                    fontSize: 13,
                                    height: 1.4,
                                    color: AppColors.textSecondary.withValues(alpha: 0.8),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                    // Age Group Section
                    const Text(
                      'Age Group',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: _ageGroups.map((age) {
                        final isSelected = _selectedAgeGroup == age;
                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedAgeGroup = age;
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.primaryGreen : AppColors.backgroundWhite,
                              borderRadius: BorderRadius.circular(25),
                              border: Border.all(
                                color: isSelected ? AppColors.primaryGreen : AppColors.cardBorder,
                              ),
                            ),
                            child: Text(
                              age,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: isSelected ? Colors.white : AppColors.textPrimary,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 32),
                    // Gender Section
                    const Text(
                      'Gender',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: _genderOptions.map((option) {
                        final isSelected = _selectedGender == option['id'];
                        return Expanded(
                          child: Padding(
                            padding: EdgeInsets.only(
                              right: option != _genderOptions.last ? 12 : 0,
                            ),
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  _selectedGender = option['id'];
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 20),
                                decoration: BoxDecoration(
                                  color: isSelected 
                                      ? AppColors.backgroundGreen 
                                      : AppColors.backgroundWhite,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: isSelected 
                                        ? AppColors.primaryGreen 
                                        : AppColors.cardBorder,
                                    width: isSelected ? 2 : 1,
                                  ),
                                ),
                                child: Column(
                                  children: [
                                    Icon(
                                      option['icon'],
                                      size: 28,
                                      color: AppColors.primaryGreen,
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      option['label'],
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                        color: isSelected 
                                            ? AppColors.textPrimary 
                                            : AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 32),
                    // Ward/Area Section
                    const Text(
                      'Your Area/Ward',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.backgroundGreen.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.cardBorder),
                      ),
                      child: TextField(
                        controller: _wardController,
                        decoration: InputDecoration(
                          hintText: 'Search your ward (e.g. Shivajinagar)',
                          hintStyle: TextStyle(
                            color: AppColors.textHint.withValues(alpha: 0.5),
                          ),
                          prefixIcon: const Icon(
                            Icons.location_on_outlined,
                            color: AppColors.primaryGreen,
                          ),
                          suffixIcon: const Icon(
                            Icons.search,
                            color: AppColors.textHint,
                          ),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Suggestions
                    Wrap(
                      spacing: 8,
                      children: [
                        Text(
                          'Suggestions:',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textHint.withValues(alpha: 0.6),
                          ),
                        ),
                        ..._wardSuggestions.map((suggestion) {
                          return GestureDetector(
                            onTap: () {
                              _wardController.text = suggestion;
                            },
                            child: Text(
                              suggestion,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textGreen,
                                decoration: TextDecoration.underline,
                              ),
                            ),
                          );
                        }),
                      ],
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
            // Bottom Section
            Container(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _canContinue
                          ? () {
                              context.read<AppState>().updateUserContext(
                                ageGroup: _selectedAgeGroup,
                                gender: _selectedGender,
                                ward: _wardController.text.isNotEmpty 
                                    ? _wardController.text 
                                    : 'Shivajinagar',
                              );
                              Navigator.pushNamed(context, AppRoutes.onboarding);
                            }
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryGreen,
                        disabledBackgroundColor: AppColors.primaryGreen.withValues(alpha: 0.4),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Text(
                            'Continue',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                          SizedBox(width: 8),
                          Icon(Icons.arrow_forward, color: Colors.white),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'STEP 3 OF 4',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.textHint.withValues(alpha: 0.6),
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
