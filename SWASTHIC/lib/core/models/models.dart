// User Profile Model
class UserProfile {
  final String? phoneNumber;
  final String? ageGroup;
  final String? gender;
  final String? ward;
  final String? language;
  final bool isGuest;

  UserProfile({
    this.phoneNumber,
    this.ageGroup,
    this.gender,
    this.ward,
    this.language,
    this.isGuest = false,
  });

  UserProfile copyWith({
    String? phoneNumber,
    String? ageGroup,
    String? gender,
    String? ward,
    String? language,
    bool? isGuest,
  }) {
    return UserProfile(
      phoneNumber: phoneNumber ?? this.phoneNumber,
      ageGroup: ageGroup ?? this.ageGroup,
      gender: gender ?? this.gender,
      ward: ward ?? this.ward,
      language: language ?? this.language,
      isGuest: isGuest ?? this.isGuest,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'phoneNumber': phoneNumber,
      'ageGroup': ageGroup,
      'gender': gender,
      'ward': ward,
      'language': language,
      'isGuest': isGuest,
    };
  }

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      phoneNumber: json['phoneNumber'],
      ageGroup: json['ageGroup'],
      gender: json['gender'],
      ward: json['ward'],
      language: json['language'],
      isGuest: json['isGuest'] ?? false,
    );
  }
}

// Symptom Model
class Symptom {
  final String id;
  final String name;
  final String category;
  final String icon;
  final int severity;
  final String duration;
  final String? details;
  final DateTime? recordedAt;

  Symptom({
    required this.id,
    required this.name,
    required this.category,
    this.icon = '',
    this.severity = 1,
    this.duration = '',
    this.details,
    this.recordedAt,
  });

  Symptom copyWith({
    String? id,
    String? name,
    String? category,
    String? icon,
    int? severity,
    String? duration,
    String? details,
    DateTime? recordedAt,
  }) {
    return Symptom(
      id: id ?? this.id,
      name: name ?? this.name,
      category: category ?? this.category,
      icon: icon ?? this.icon,
      severity: severity ?? this.severity,
      duration: duration ?? this.duration,
      details: details ?? this.details,
      recordedAt: recordedAt ?? this.recordedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'icon': icon,
      'severity': severity,
      'duration': duration,
      'details': details,
      'recordedAt': recordedAt?.toIso8601String(),
    };
  }

  factory Symptom.fromJson(Map<String, dynamic> json) {
    return Symptom(
      id: json['id'],
      name: json['name'],
      category: json['category'],
      icon: json['icon'] ?? '',
      severity: json['severity'] ?? 1,
      duration: json['duration'] ?? '',
      details: json['details'],
      recordedAt: json['recordedAt'] != null 
          ? DateTime.parse(json['recordedAt']) 
          : null,
    );
  }
}

// Health Alert Model
class HealthAlert {
  final String id;
  final String title;
  final String description;
  final String type;
  final String priority;
  final DateTime createdAt;
  final bool isRead;
  final String? imageUrl;
  final String? actionLabel;

  HealthAlert({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.priority,
    required this.createdAt,
    this.isRead = false,
    this.imageUrl,
    this.actionLabel,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'type': type,
      'priority': priority,
      'createdAt': createdAt.toIso8601String(),
      'isRead': isRead,
      'imageUrl': imageUrl,
      'actionLabel': actionLabel,
    };
  }

  factory HealthAlert.fromJson(Map<String, dynamic> json) {
    return HealthAlert(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      type: json['type'],
      priority: json['priority'],
      createdAt: DateTime.parse(json['createdAt']),
      isRead: json['isRead'] ?? false,
      imageUrl: json['imageUrl'],
      actionLabel: json['actionLabel'],
    );
  }
}

// Government Scheme Model
class GovernmentScheme {
  final String id;
  final String title;
  final String description;
  final String category;
  final bool isEligible;
  final bool needsVerification;
  final String? imageUrl;

  GovernmentScheme({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    this.isEligible = false,
    this.needsVerification = false,
    this.imageUrl,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'isEligible': isEligible,
      'needsVerification': needsVerification,
      'imageUrl': imageUrl,
    };
  }

  factory GovernmentScheme.fromJson(Map<String, dynamic> json) {
    return GovernmentScheme(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      category: json['category'],
      isEligible: json['isEligible'] ?? false,
      needsVerification: json['needsVerification'] ?? false,
      imageUrl: json['imageUrl'],
    );
  }
}

// Health Habit Model
class HealthHabit {
  final String id;
  final String name;
  final String icon;
  final double targetValue;
  final double currentValue;
  final String unit;
  final bool isCompleted;

  HealthHabit({
    required this.id,
    required this.name,
    required this.icon,
    required this.targetValue,
    this.currentValue = 0,
    this.unit = '',
    this.isCompleted = false,
  });

  double get progress => targetValue > 0 ? (currentValue / targetValue).clamp(0.0, 1.0) : 0.0;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'icon': icon,
      'targetValue': targetValue,
      'currentValue': currentValue,
      'unit': unit,
      'isCompleted': isCompleted,
    };
  }

  factory HealthHabit.fromJson(Map<String, dynamic> json) {
    return HealthHabit(
      id: json['id'],
      name: json['name'],
      icon: json['icon'],
      targetValue: (json['targetValue'] as num).toDouble(),
      currentValue: (json['currentValue'] as num?)?.toDouble() ?? 0,
      unit: json['unit'] ?? '',
      isCompleted: json['isCompleted'] ?? false,
    );
  }
}

// Language Model
class LanguageOption {
  final String code;
  final String name;
  final String welcomeText;

  LanguageOption({
    required this.code,
    required this.name,
    required this.welcomeText,
  });
}
