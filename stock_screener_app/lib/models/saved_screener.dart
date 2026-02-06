class SavedScreener {
  final int screenerId;
  final int userId;
  final String name;
  final String? description;
  final Map<String, dynamic> dslQuery;
  final DateTime createdAt;
  final DateTime? lastRunAt;
  final int matchedStocksCount;
  final bool notificationEnabled;
  final bool active;

  SavedScreener({
    required this.screenerId,
    required this.userId,
    required this.name,
    this.description,
    required this.dslQuery,
    required this.createdAt,
    this.lastRunAt,
    this.matchedStocksCount = 0,
    required this.notificationEnabled,
    required this.active,
  });

  factory SavedScreener.fromJson(Map<String, dynamic> json) {
    return SavedScreener(
      screenerId: (json['screenerId'] ?? json['screener_id']) as int,
      userId: (json['userId'] ?? json['user_id']) as int,
      name: json['name'] ?? '',
      description: json['description'],
      dslQuery: Map<String, dynamic>.from(json['dslQuery'] ?? json['dsl_query'] ?? {}),
      createdAt: DateTime.parse(json['createdAt'] ?? json['created_at'] ?? DateTime.now().toIso8601String()),
      lastRunAt: json['lastRunAt'] != null || json['last_run_at'] != null
          ? DateTime.tryParse(json['lastRunAt'] ?? json['last_run_at'] ?? '')
          : null,
      matchedStocksCount: (json['matchedStocksCount'] ?? json['matched_stocks_count'] ?? 0) as int,
      notificationEnabled: (json['notificationEnabled'] ?? json['notification_enabled'] ?? true) as bool,
      active: (json['active'] ?? true) as bool,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'screenerId': screenerId,
      'userId': userId,
      'name': name,
      'description': description,
      'dslQuery': dslQuery,
      'createdAt': createdAt.toIso8601String(),
      'lastRunAt': lastRunAt?.toIso8601String(),
      'matchedStocksCount': matchedStocksCount,
      'notificationEnabled': notificationEnabled,
      'active': active,
    };
  }

  /// Get a human-readable description of the screener conditions
  String getDescription() {
    if (description != null && description!.isNotEmpty) {
      return description!;
    }
    
    try {
      final condition = dslQuery['condition'] ?? 'AND';
      final rules = dslQuery['rules'] as List<dynamic>? ?? [];
      
      if (rules.isEmpty) return 'No conditions set';
      
      final descriptions = rules.map((rule) {
        final field = rule['field'] ?? '';
        final operator = rule['operator'] ?? '';
        final value = rule['value'] ?? '';
        
        return _formatRule(field, operator, value);
      }).join(condition == 'AND' ? ' AND ' : ' OR ');
      
      return descriptions;
    } catch (e) {
      return 'Custom filter';
    }
  }

  String _formatRule(String field, String operator, dynamic value) {
    final operatorMap = {
      '<': 'less than',
      '<=': 'less than or equal to',
      '>': 'greater than',
      '>=': 'greater than or equal to',
      '=': 'equals',
      '!=': 'not equals',
    };
    
    final fieldName = field.replaceAll('_', ' ').toLowerCase();
    final operatorText = operatorMap[operator] ?? operator;
    
    return '$fieldName $operatorText $value';
  }

  /// Get count of conditions
  int getConditionCount() {
    try {
      final rules = dslQuery['rules'] as List<dynamic>? ?? [];
      return rules.length;
    } catch (e) {
      return 0;
    }
  }

  /// Copy with method for updates
  SavedScreener copyWith({
    int? screenerId,
    int? userId,
    String? name,
    String? description,
    Map<String, dynamic>? dslQuery,
    DateTime? createdAt,
    DateTime? lastRunAt,
    int? matchedStocksCount,
    bool? notificationEnabled,
    bool? active,
  }) {
    return SavedScreener(
      screenerId: screenerId ?? this.screenerId,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      description: description ?? this.description,
      dslQuery: dslQuery ?? this.dslQuery,
      createdAt: createdAt ?? this.createdAt,
      lastRunAt: lastRunAt ?? this.lastRunAt,
      matchedStocksCount: matchedStocksCount ?? this.matchedStocksCount,
      notificationEnabled: notificationEnabled ?? this.notificationEnabled,
      active: active ?? this.active,
    );
  }
}

class ScreenerStats {
  final int totalScreeners;
  final int activeScreeners;
  final int withNotifications;
  final int totalMatches;

  ScreenerStats({
    required this.totalScreeners,
    required this.activeScreeners,
    required this.withNotifications,
    required this.totalMatches,
  });

  factory ScreenerStats.fromJson(Map<String, dynamic> json) {
    return ScreenerStats(
      totalScreeners: (json['totalScreeners'] ?? json['total_screeners'] ?? json['total'] ?? 0) as int,
      activeScreeners: (json['activeScreeners'] ?? json['active_screeners'] ?? json['active'] ?? 0) as int,
      withNotifications: (json['withNotifications'] ?? json['with_notifications'] ?? 0) as int,
      totalMatches: (json['totalMatches'] ?? json['total_matches'] ?? 0) as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalScreeners': totalScreeners,
      'activeScreeners': activeScreeners,
      'withNotifications': withNotifications,
      'totalMatches': totalMatches,
    };
  }
}
