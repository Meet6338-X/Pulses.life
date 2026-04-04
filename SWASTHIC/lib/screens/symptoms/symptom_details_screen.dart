import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/routes/app_routes.dart';
import '../../core/state/app_state.dart';
import '../../core/models/models.dart';

class SymptomDetailsScreen extends StatefulWidget {
  const SymptomDetailsScreen({super.key});

  @override
  State<SymptomDetailsScreen> createState() => _SymptomDetailsScreenState();
}

class _SymptomDetailsScreenState extends State<SymptomDetailsScreen> {
  final Map<String, int> _severities = {};
  final Map<String, String> _durations = {};
  final Map<String, TextEditingController> _detailControllers = {};

  final List<String> _durationOptions = ['Few hours', '1 day', '2-3 days', 'More than a week'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final symptoms = context.read<AppState>().selectedSymptoms;
      for (var symptom in symptoms) {
        _severities[symptom.id] = 3;
        _durations[symptom.id] = '1 day';
        _detailControllers[symptom.id] = TextEditingController();
      }
      setState(() {});
    });
  }

  @override
  void dispose() {
    for (var controller in _detailControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  String _getSeverityLabel(int severity) {
    switch (severity) {
      case 1:
        return 'Mild (1)';
      case 2:
        return 'Low (2)';
      case 3:
        return 'Moderate (3)';
      case 4:
        return 'High (4)';
      case 5:
        return 'Severe (5)';
      default:
        return 'Moderate (3)';
    }
  }

  Color _getSeverityColor(int severity) {
    if (severity <= 2) return AppColors.statusMild;
    if (severity <= 3) return AppColors.statusModerate;
    return AppColors.statusSevere;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundWhite,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
          color: AppColors.textPrimary,
        ),
        title: const Text(
          'Tell us more',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: Consumer<AppState>(
        builder: (context, appState, child) {
          final symptoms = appState.selectedSymptoms;
          final completedCount = symptoms.where((s) => 
            _severities[s.id] != null && _durations[s.id] != null
          ).length;

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 8),
                      const Text(
                        'Symptom Details',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Help SAMVED-VAKR analyze your condition by providing severity and duration.',
                        style: TextStyle(
                          fontSize: 14,
                          height: 1.4,
                          color: AppColors.textSecondary.withValues(alpha: 0.8),
                        ),
                      ),
                      const SizedBox(height: 24),
                      // Symptom Cards
                      ...symptoms.map((symptom) => _buildSymptomCard(symptom)),
                    ],
                  ),
                ),
              ),
              // Bottom Section
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
                          const Text(
                            'Information Progress',
                            style: TextStyle(
                              fontSize: 14,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const Spacer(),
                          Text(
                            '$completedCount/${symptoms.length} Complete',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primaryGreen,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      LinearProgressIndicator(
                        value: symptoms.isEmpty ? 0 : completedCount / symptoms.length,
                        backgroundColor: AppColors.cardBorder,
                        valueColor: const AlwaysStoppedAnimation<Color>(
                          AppColors.primaryGreen,
                        ),
                        minHeight: 6,
                        borderRadius: BorderRadius.circular(3),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          onPressed: () {
                            // Update symptoms with details
                            for (var symptom in symptoms) {
                              final updated = symptom.copyWith(
                                severity: _severities[symptom.id] ?? 3,
                                duration: _durations[symptom.id] ?? '1 day',
                                details: _detailControllers[symptom.id]?.text,
                              );
                              appState.updateSymptom(updated);
                            }
                            appState.submitSymptomReport();
                            Navigator.pushNamed(context, AppRoutes.aiGuidance);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryGreen,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: const [
                              Text(
                                'Continue to Summary',
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
          );
        },
      ),
    );
  }

  Widget _buildSymptomCard(Symptom symptom) {
    final severity = _severities[symptom.id] ?? 3;
    final duration = _durations[symptom.id] ?? '1 day';

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.backgroundWhite,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.backgroundGreen,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  _getSymptomIcon(symptom.category),
                  color: AppColors.primaryGreen,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  symptom.name,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Severity Slider
          Row(
            children: [
              const Text(
                'Severity (1-5)',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textPrimary,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _getSeverityColor(severity).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _getSeverityLabel(severity),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: _getSeverityColor(severity),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                'MILD',
                style: TextStyle(
                  fontSize: 10,
                  color: AppColors.textHint,
                ),
              ),
              Expanded(
                child: SliderTheme(
                  data: SliderThemeData(
                    activeTrackColor: _getSeverityColor(severity),
                    inactiveTrackColor: AppColors.cardBorder,
                    thumbColor: Colors.white,
                    trackHeight: 6,
                    thumbShape: const RoundSliderThumbShape(
                      enabledThumbRadius: 10,
                    ),
                  ),
                  child: Slider(
                    value: severity.toDouble(),
                    min: 1,
                    max: 5,
                    divisions: 4,
                    onChanged: (value) {
                      setState(() {
                        _severities[symptom.id] = value.round();
                      });
                    },
                  ),
                ),
              ),
              Text(
                'SEVERE',
                style: TextStyle(
                  fontSize: 10,
                  color: AppColors.textHint,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Duration
          const Text(
            'How long has this lasted?',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _durationOptions.map((option) {
              final isSelected = duration == option;
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _durations[symptom.id] = option;
                  });
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primaryGreen : AppColors.backgroundWhite,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isSelected ? AppColors.primaryGreen : AppColors.cardBorder,
                    ),
                  ),
                  child: Text(
                    option,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: isSelected ? Colors.white : AppColors.textPrimary,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),
          // Optional Details
          Row(
            children: [
              Icon(Icons.notes, size: 16, color: AppColors.textSecondary),
              const SizedBox(width: 8),
              Text(
                'Add details (Optional)',
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _detailControllers[symptom.id],
            maxLines: 2,
            decoration: InputDecoration(
              hintText: _getPlaceholderForSymptom(symptom.name),
              hintStyle: TextStyle(
                color: AppColors.textHint.withValues(alpha: 0.5),
              ),
              filled: true,
              fillColor: AppColors.backgroundGreen.withValues(alpha: 0.2),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.all(16),
            ),
          ),
        ],
      ),
    );
  }

  IconData _getSymptomIcon(String category) {
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

  String _getPlaceholderForSymptom(String symptomName) {
    if (symptomName.toLowerCase().contains('fever')) {
      return 'e.g. Temperature spikes at night...';
    }
    if (symptomName.toLowerCase().contains('cough')) {
      return 'e.g. Dry cough, worse when lying down';
    }
    return 'Add any additional details...';
  }
}
