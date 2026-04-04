import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/routes/app_routes.dart';
import '../../core/state/app_state.dart';
import '../../core/models/models.dart';

class SelectSymptomsScreen extends StatefulWidget {
  const SelectSymptomsScreen({super.key});

  @override
  State<SelectSymptomsScreen> createState() => _SelectSymptomsScreenState();
}

class _SelectSymptomsScreenState extends State<SelectSymptomsScreen> {
  final _searchController = TextEditingController();
  final Set<String> _selectedSymptomIds = {};

  final Map<String, List<SymptomOption>> _symptomCategories = {
    'Fever': [
      SymptomOption(id: 'fever_high', name: 'High fever (>101°F)', icon: Icons.thermostat),
      SymptomOption(id: 'chills', name: 'Chills & Shivers', icon: Icons.ac_unit),
      SymptomOption(id: 'night_sweats', name: 'Night Sweats', icon: Icons.nightlight),
    ],
    'Respiratory': [
      SymptomOption(id: 'cough', name: 'Cough', icon: Icons.masks),
      SymptomOption(id: 'shortness_breath', name: 'Shortness of Breath', icon: Icons.air),
      SymptomOption(id: 'sore_throat', name: 'Sore Throat', icon: Icons.mic_off),
    ],
    'Digestive': [
      SymptomOption(id: 'nausea', name: 'Nausea or Vomiting', icon: Icons.sick),
      SymptomOption(id: 'diarrhea', name: 'Diarrhea', icon: Icons.wc),
    ],
    'Pain & Aches': [
      SymptomOption(id: 'headache', name: 'Severe Headache', icon: Icons.psychology),
      SymptomOption(id: 'muscle_ache', name: 'Muscle Ache', icon: Icons.fitness_center),
    ],
    'Skin': [
      SymptomOption(id: 'rash', name: 'Rash or Redness', icon: Icons.face),
      SymptomOption(id: 'itching', name: 'Itching', icon: Icons.pan_tool),
    ],
  };

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _toggleSymptom(String symptomId) {
    setState(() {
      if (_selectedSymptomIds.contains(symptomId)) {
        _selectedSymptomIds.remove(symptomId);
      } else {
        _selectedSymptomIds.add(symptomId);
      }
    });
  }

  SymptomOption? _findSymptomById(String id) {
    for (var category in _symptomCategories.entries) {
      for (var symptom in category.value) {
        if (symptom.id == id) return symptom;
      }
    }
    return null;
  }

  String _getCategoryForSymptom(String id) {
    for (var category in _symptomCategories.entries) {
      for (var symptom in category.value) {
        if (symptom.id == id) return category.key;
      }
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundWhite,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.chevron_left, size: 28),
          onPressed: () => Navigator.pop(context),
          color: AppColors.textPrimary,
        ),
        title: Column(
          children: [
            Text(
              'SAMVED-VAKR',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: AppColors.primaryGreen,
                letterSpacing: 1,
              ),
            ),
            const Text(
              'Symptom Selection',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.help_outline),
            onPressed: () {},
            color: AppColors.textSecondary,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.backgroundGreen.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search symptoms...',
                  hintStyle: TextStyle(
                    color: AppColors.textHint.withValues(alpha: 0.5),
                  ),
                  prefixIcon: const Icon(Icons.search, color: AppColors.textHint),
                  suffixIcon: const Icon(Icons.mic, color: AppColors.textHint),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
              ),
            ),
          ),
          // Title
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'What are you experiencing?',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Select all that apply for accurate analysis.',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Symptoms List
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _symptomCategories.length,
              itemBuilder: (context, index) {
                final category = _symptomCategories.entries.elementAt(index);
                return _buildCategorySection(category.key, category.value);
              },
            ),
          ),
          // Bottom Summary
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.backgroundWhite,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: SafeArea(
              top: false,
              child: Column(
                children: [
                  Row(
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Selection Summary',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary.withValues(alpha: 0.7),
                            ),
                          ),
                          Text(
                            '${_selectedSymptomIds.length} symptoms selected',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primaryGreen,
                            ),
                          ),
                        ],
                      ),
                      const Spacer(),
                      if (_selectedSymptomIds.isNotEmpty)
                        TextButton(
                          onPressed: () {
                            setState(() {
                              _selectedSymptomIds.clear();
                            });
                          },
                          child: Row(
                            children: [
                              Icon(Icons.close, size: 16, color: AppColors.textSecondary),
                              const SizedBox(width: 4),
                              Text(
                                'CLEAR ALL',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _selectedSymptomIds.isNotEmpty
                          ? () {
                              // Add selected symptoms to state
                              final appState = context.read<AppState>();
                              for (var id in _selectedSymptomIds) {
                                final symptomOption = _findSymptomById(id);
                                if (symptomOption != null) {
                                  appState.addSymptom(Symptom(
                                    id: id,
                                    name: symptomOption.name,
                                    category: _getCategoryForSymptom(id),
                                  ));
                                }
                              }
                              Navigator.pushNamed(context, AppRoutes.symptomDetails);
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
                            'Continue to Analysis',
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
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategorySection(String category, List<SymptomOption> symptoms) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              _getCategoryIcon(category),
              size: 18,
              color: AppColors.primaryGreen,
            ),
            const SizedBox(width: 8),
            Text(
              category,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.primaryGreen,
              ),
            ),
            const Spacer(),
            Text(
              '${symptoms.length} options',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.alertOrange,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: symptoms.map((symptom) {
            final isSelected = _selectedSymptomIds.contains(symptom.id);
            return _buildSymptomChip(symptom, isSelected);
          }).toList(),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildSymptomChip(SymptomOption symptom, bool isSelected) {
    return GestureDetector(
      onTap: () => _toggleSymptom(symptom.id),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryGreen : AppColors.backgroundWhite,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primaryGreen : AppColors.cardBorder,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  symptom.icon,
                  size: 24,
                  color: isSelected ? Colors.white : AppColors.primaryGreen,
                ),
                if (isSelected) ...[
                  const SizedBox(width: 8),
                  const Icon(
                    Icons.check_circle,
                    size: 16,
                    color: Colors.white,
                  ),
                ],
              ],
            ),
            const SizedBox(height: 8),
            Text(
              symptom.name,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: isSelected ? Colors.white : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'Fever':
        return Icons.thermostat;
      case 'Respiratory':
        return Icons.air;
      case 'Digestive':
        return Icons.restaurant;
      case 'Pain & Aches':
        return Icons.accessibility_new;
      case 'Skin':
        return Icons.face;
      default:
        return Icons.health_and_safety;
    }
  }
}

class SymptomOption {
  final String id;
  final String name;
  final IconData icon;

  SymptomOption({
    required this.id,
    required this.name,
    required this.icon,
  });
}
