class RiskAnalysis {
  final String symbol;
  final String overallRisk; // LOW, MEDIUM, HIGH, VERY HIGH
  final int riskScore; // 0-100
  final RiskBreakdown breakdown;
  final List<String> mitigationInsights;
  final String investorSuitability;

  RiskAnalysis({
    required this.symbol,
    required this.overallRisk,
    required this.riskScore,
    required this.breakdown,
    required this.mitigationInsights,
    required this.investorSuitability,
  });

  factory RiskAnalysis.fromJson(Map<String, dynamic> json) {
    return RiskAnalysis(
      symbol: json['symbol'] ?? '',
      overallRisk: json['overallRisk'] ?? json['overall_risk'] ?? 'UNKNOWN',
      riskScore: (json['riskScore'] ?? json['risk_score'] ?? 0) as int,
      breakdown: RiskBreakdown.fromJson(json['breakdown'] ?? {}),
      mitigationInsights: (json['mitigationInsights'] ?? json['mitigation_insights'] as List<dynamic>?)
              ?.map((m) => m.toString())
              .toList() ??
          [],
      investorSuitability: json['investorSuitability'] ?? json['investor_suitability'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'symbol': symbol,
      'overallRisk': overallRisk,
      'riskScore': riskScore,
      'breakdown': breakdown.toJson(),
      'mitigationInsights': mitigationInsights,
      'investorSuitability': investorSuitability,
    };
  }

  /// Get color based on risk level
  String get riskColor {
    switch (overallRisk) {
      case 'LOW':
        return '#4CAF50'; // Green
      case 'MEDIUM':
        return '#FF9800'; // Orange
      case 'HIGH':
        return '#F44336'; // Red
      case 'VERY HIGH':
        return '#D32F2F'; // Dark Red
      default:
        return '#9E9E9E'; // Grey
    }
  }

  /// Get icon based on risk level
  String get riskIcon {
    switch (overallRisk) {
      case 'LOW':
        return '✅';
      case 'MEDIUM':
        return '⚠️';
      case 'HIGH':
        return '🔴';
      case 'VERY HIGH':
        return '🚨';
      default:
        return '❓';
    }
  }
}

class RiskBreakdown {
  final RiskFactor debtRisk;
  final RiskFactor earningsRisk;
  final RiskFactor valuationRisk;
  final RiskFactor growthRisk;
  final RiskFactor sectorRisk;

  RiskBreakdown({
    required this.debtRisk,
    required this.earningsRisk,
    required this.valuationRisk,
    required this.growthRisk,
    required this.sectorRisk,
  });

  factory RiskBreakdown.fromJson(Map<String, dynamic> json) {
    return RiskBreakdown(
      debtRisk: RiskFactor.fromJson(json['debtRisk'] ?? json['debt_risk'] ?? {}),
      earningsRisk: RiskFactor.fromJson(json['earningsRisk'] ?? json['earnings_risk'] ?? {}),
      valuationRisk: RiskFactor.fromJson(json['valuationRisk'] ?? json['valuation_risk'] ?? {}),
      growthRisk: RiskFactor.fromJson(json['growthRisk'] ?? json['growth_risk'] ?? {}),
      sectorRisk: RiskFactor.fromJson(json['sectorRisk'] ?? json['sector_risk'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'debtRisk': debtRisk.toJson(),
      'earningsRisk': earningsRisk.toJson(),
      'valuationRisk': valuationRisk.toJson(),
      'growthRisk': growthRisk.toJson(),
      'sectorRisk': sectorRisk.toJson(),
    };
  }

  /// Get all risk factors as a list for easy iteration
  List<MapEntry<String, RiskFactor>> get allFactors => [
        MapEntry('Debt Risk', debtRisk),
        MapEntry('Earnings Risk', earningsRisk),
        MapEntry('Valuation Risk', valuationRisk),
        MapEntry('Growth Risk', growthRisk),
        MapEntry('Sector Risk', sectorRisk),
      ];
}

class RiskFactor {
  final String level; // LOW, MEDIUM, HIGH, VERY HIGH
  final int score; // 0-100
  final double weight; // 0.0-1.0
  final String? details;

  RiskFactor({
    required this.level,
    required this.score,
    required this.weight,
    this.details,
  });

  factory RiskFactor.fromJson(Map<String, dynamic> json) {
    return RiskFactor(
      level: json['level'] ?? 'UNKNOWN',
      score: (json['score'] ?? 0) as int,
      weight: (json['weight'] ?? 0.0).toDouble(),
      details: json['details']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'level': level,
      'score': score,
      'weight': weight,
      'details': details,
    };
  }

  /// Get weighted contribution to overall risk
  double get weightedScore => score * weight;

  /// Get color based on risk level
  String get color {
    switch (level) {
      case 'LOW':
        return '#4CAF50';
      case 'MEDIUM':
        return '#FF9800';
      case 'HIGH':
        return '#F44336';
      case 'VERY HIGH':
        return '#D32F2F';
      default:
        return '#9E9E9E';
    }
  }

  /// Get percentage (0-100) for progress bars
  int get percentage => score;
}
