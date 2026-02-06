class StockInsights {
  final String symbol;
  final Fundamentals fundamentals;
  final List<QuarterlyPerformance> quarterlyPerformance;
  final ValuationInsights valuationInsights;
  final GrowthInsights growthInsights;
  final List<String> keyHighlights;
  final List<String> riskFactors;
  final String disclaimer;

  StockInsights({
    required this.symbol,
    required this.fundamentals,
    required this.quarterlyPerformance,
    required this.valuationInsights,
    required this.growthInsights,
    required this.keyHighlights,
    required this.riskFactors,
    required this.disclaimer,
  });

  factory StockInsights.fromJson(Map<String, dynamic> json) {
    return StockInsights(
      symbol: json['symbol'] ?? '',
      fundamentals: Fundamentals.fromJson(json['fundamentals'] ?? {}),
      quarterlyPerformance: (json['quarterlyPerformance'] as List<dynamic>?)
              ?.map((q) => QuarterlyPerformance.fromJson(q))
              .toList() ??
          [],
      valuationInsights: ValuationInsights.fromJson(json['valuationInsights'] ?? {}),
      growthInsights: GrowthInsights.fromJson(json['growthInsights'] ?? {}),
      keyHighlights: (json['keyHighlights'] as List<dynamic>?)
              ?.map((h) => h.toString())
              .toList() ??
          [],
      riskFactors: (json['riskFactors'] as List<dynamic>?)
              ?.map((r) => r.toString())
              .toList() ??
          [],
      disclaimer: json['disclaimer'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'symbol': symbol,
      'fundamentals': fundamentals.toJson(),
      'quarterlyPerformance': quarterlyPerformance.map((q) => q.toJson()).toList(),
      'valuationInsights': valuationInsights.toJson(),
      'growthInsights': growthInsights.toJson(),
      'keyHighlights': keyHighlights,
      'riskFactors': riskFactors,
      'disclaimer': disclaimer,
    };
  }
}

class Fundamentals {
  final String? companyName;
  final String? sector;
  final double marketCap;
  final double peRatio;
  final double pbRatio;
  final double debtToEquity;
  final String category; // Large Cap, Mid Cap, Small Cap

  Fundamentals({
    this.companyName,
    this.sector,
    required this.marketCap,
    required this.peRatio,
    required this.pbRatio,
    required this.debtToEquity,
    required this.category,
  });

  factory Fundamentals.fromJson(Map<String, dynamic> json) {
    return Fundamentals(
      companyName: json['companyName'] ?? json['company_name'],
      sector: json['sector'],
      marketCap: (json['marketCap'] ?? json['market_cap'] ?? 0).toDouble(),
      peRatio: (json['peRatio'] ?? json['pe_ratio'] ?? 0).toDouble(),
      pbRatio: (json['pbRatio'] ?? json['pb_ratio'] ?? 0).toDouble(),
      debtToEquity: (json['debtToEquity'] ?? json['debt_to_equity'] ?? 0).toDouble(),
      category: json['category'] ?? 'Unknown',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'companyName': companyName,
      'sector': sector,
      'marketCap': marketCap,
      'peRatio': peRatio,
      'pbRatio': pbRatio,
      'debtToEquity': debtToEquity,
      'category': category,
    };
  }
}

class QuarterlyPerformance {
  final String quarter;
  final double revenue;
  final double profit;
  final double margin;

  QuarterlyPerformance({
    required this.quarter,
    required this.revenue,
    required this.profit,
    required this.margin,
  });

  factory QuarterlyPerformance.fromJson(Map<String, dynamic> json) {
    return QuarterlyPerformance(
      quarter: json['quarter'] ?? '',
      revenue: (json['revenue'] ?? 0).toDouble(),
      profit: (json['profit'] ?? 0).toDouble(),
      margin: (json['margin'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'quarter': quarter,
      'revenue': revenue,
      'profit': profit,
      'margin': margin,
    };
  }
}

class ValuationInsights {
  final String relativePE;
  final String interpretation;
  final String? sectorAvgPE;

  ValuationInsights({
    required this.relativePE,
    required this.interpretation,
    this.sectorAvgPE,
  });

  factory ValuationInsights.fromJson(Map<String, dynamic> json) {
    return ValuationInsights(
      relativePE: json['relativePE'] ?? json['relative_pe'] ?? '',
      interpretation: json['interpretation'] ?? '',
      sectorAvgPE: json['sectorAvgPE']?.toString() ?? json['sector_avg_pe']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'relativePE': relativePE,
      'interpretation': interpretation,
      'sectorAvgPE': sectorAvgPE,
    };
  }
}

class GrowthInsights {
  final double? revenueGrowthYoY;
  final double? earningsGrowthYoY;
  final String trend;

  GrowthInsights({
    this.revenueGrowthYoY,
    this.earningsGrowthYoY,
    required this.trend,
  });

  factory GrowthInsights.fromJson(Map<String, dynamic> json) {
    return GrowthInsights(
      revenueGrowthYoY: json['revenueGrowthYoY']?.toDouble() ?? json['revenue_growth_yoy']?.toDouble(),
      earningsGrowthYoY: json['earningsGrowthYoY']?.toDouble() ?? json['earnings_growth_yoy']?.toDouble(),
      trend: json['trend'] ?? 'Unknown',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'revenueGrowthYoY': revenueGrowthYoY,
      'earningsGrowthYoY': earningsGrowthYoY,
      'trend': trend,
    };
  }
}
