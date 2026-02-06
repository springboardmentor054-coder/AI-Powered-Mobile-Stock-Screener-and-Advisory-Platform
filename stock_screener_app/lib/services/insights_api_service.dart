import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/stock_insights.dart';
import '../models/risk_analysis.dart';

class InsightsApiService {
  final String baseUrl;

  InsightsApiService({this.baseUrl = 'http://192.168.1.2:5000/api/insights'});

  /// Get comprehensive stock insights including fundamentals, quarterly performance, and analysis
  Future<StockInsights> getStockInsights(String symbol) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/stock/$symbol'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return StockInsights.fromJson(data);
      } else if (response.statusCode == 404) {
        throw Exception('Stock not found: $symbol');
      } else {
        throw Exception('Failed to load insights: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching stock insights: $e');
    }
  }

  /// Get comprehensive risk analysis for a stock
  Future<RiskAnalysis> getRiskAnalysis(String symbol) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/risk/$symbol'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return RiskAnalysis.fromJson(data);
      } else if (response.statusCode == 404) {
        throw Exception('Stock not found: $symbol');
      } else {
        throw Exception('Failed to load risk analysis: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching risk analysis: $e');
    }
  }

  /// Get stocks with positive earnings for N consecutive quarters
  Future<List<QuarterlyFilterResult>> getPositiveEarningsStocks({
    int nQuarters = 4,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/quarterly/positive-earnings?nQuarters=$nQuarters'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => QuarterlyFilterResult.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load positive earnings stocks: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching positive earnings stocks: $e');
    }
  }

  /// Get stocks with revenue growth above minimum threshold
  Future<List<QuarterlyFilterResult>> getRevenueGrowthStocks({
    int nQuarters = 4,
    double minGrowth = 10.0,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/quarterly/revenue-growth?nQuarters=$nQuarters&minGrowth=$minGrowth'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => QuarterlyFilterResult.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load revenue growth stocks: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching revenue growth stocks: $e');
    }
  }

  /// Get stocks with improving profit margins
  Future<List<QuarterlyFilterResult>> getImprovingMarginsStocks({
    int nQuarters = 4,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/quarterly/improving-margins?nQuarters=$nQuarters'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => QuarterlyFilterResult.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load improving margins stocks: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching improving margins stocks: $e');
    }
  }

  /// Get stocks with consistent performance (low volatility)
  Future<List<QuarterlyFilterResult>> getConsistentPerformanceStocks({
    double maxVolatility = 0.15,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/quarterly/consistent-performance?maxVolatility=$maxVolatility'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => QuarterlyFilterResult.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load consistent performance stocks: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching consistent performance stocks: $e');
    }
  }

  /// Get sector outperformers
  Future<List<QuarterlyFilterResult>> getSectorOutperformers({
    required String sector,
    int nQuarters = 4,
  }) async {
    try {
      final encodedSector = Uri.encodeComponent(sector);
      final response = await http.get(
        Uri.parse('$baseUrl/quarterly/sector-outperformers/$encodedSector?nQuarters=$nQuarters'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => QuarterlyFilterResult.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load sector outperformers: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching sector outperformers: $e');
    }
  }

  /// Get quarterly trend for a specific stock
  Future<QuarterlyTrend> getQuarterlyTrend({
    required String symbol,
    int nQuarters = 8,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/quarterly/trend/$symbol?nQuarters=$nQuarters'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return QuarterlyTrend.fromJson(data);
      } else if (response.statusCode == 404) {
        throw Exception('Stock not found: $symbol');
      } else {
        throw Exception('Failed to load quarterly trend: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching quarterly trend: $e');
    }
  }
}

/// Generic quarterly filter result model
class QuarterlyFilterResult {
  final String symbol;
  final String companyName;
  final Map<String, dynamic> metrics;

  QuarterlyFilterResult({
    required this.symbol,
    required this.companyName,
    required this.metrics,
  });

  factory QuarterlyFilterResult.fromJson(Map<String, dynamic> json) {
    return QuarterlyFilterResult(
      symbol: json['symbol'] ?? '',
      companyName: json['companyName'] ?? json['company_name'] ?? '',
      metrics: Map<String, dynamic>.from(json)..remove('symbol')..remove('companyName')..remove('company_name'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'symbol': symbol,
      'companyName': companyName,
      ...metrics,
    };
  }
}

/// Quarterly trend data model
class QuarterlyTrend {
  final String symbol;
  final String companyName;
  final List<QuarterlyData> quarterlyData;
  final TrendDirection trends;

  QuarterlyTrend({
    required this.symbol,
    required this.companyName,
    required this.quarterlyData,
    required this.trends,
  });

  factory QuarterlyTrend.fromJson(Map<String, dynamic> json) {
    return QuarterlyTrend(
      symbol: json['symbol'] ?? '',
      companyName: json['companyName'] ?? json['company_name'] ?? '',
      quarterlyData: (json['quarterlyData'] as List<dynamic>?)
              ?.map((q) => QuarterlyData.fromJson(q))
              .toList() ??
          [],
      trends: TrendDirection.fromJson(json['trends'] ?? {}),
    );
  }
}

class QuarterlyData {
  final String quarter;
  final double revenue;
  final double profit;
  final double margin;
  final double? revenueGrowthQoQ;
  final double? profitGrowthQoQ;

  QuarterlyData({
    required this.quarter,
    required this.revenue,
    required this.profit,
    required this.margin,
    this.revenueGrowthQoQ,
    this.profitGrowthQoQ,
  });

  factory QuarterlyData.fromJson(Map<String, dynamic> json) {
    return QuarterlyData(
      quarter: json['quarter'] ?? '',
      revenue: (json['revenue'] ?? 0).toDouble(),
      profit: (json['profit'] ?? 0).toDouble(),
      margin: (json['margin'] ?? 0).toDouble(),
      revenueGrowthQoQ: json['revenueGrowthQoQ']?.toDouble(),
      profitGrowthQoQ: json['profitGrowthQoQ']?.toDouble(),
    );
  }
}

class TrendDirection {
  final String revenueDirection;
  final String profitDirection;
  final String marginDirection;

  TrendDirection({
    required this.revenueDirection,
    required this.profitDirection,
    required this.marginDirection,
  });

  factory TrendDirection.fromJson(Map<String, dynamic> json) {
    return TrendDirection(
      revenueDirection: json['revenueDirection'] ?? 'Unknown',
      profitDirection: json['profitDirection'] ?? 'Unknown',
      marginDirection: json['marginDirection'] ?? 'Unknown',
    );
  }
}
