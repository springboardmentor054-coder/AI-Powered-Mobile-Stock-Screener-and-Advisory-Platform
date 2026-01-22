class Stock {
  final String symbol;
  final String name;
  final String sector;
  final double? peRatio;
  final double? pegRatio;
  final double? debtToFcf;
  final double? revenueGrowth;
  final double? marketCap;
  final double? eps;
  final String? exchange;
  
  // Real-time data (will be fetched from API)
  final double? currentPrice;
  final double? changePercent;
  final double? changeAmount;
  final double? dayHigh;
  final double? dayLow;
  final double? volume;
  final double? avgVolume;
  final double? fiftyTwoWeekHigh;
  final double? fiftyTwoWeekLow;

  Stock({
    required this.symbol,
    required this.name,
    required this.sector,
    this.peRatio,
    this.pegRatio,
    this.debtToFcf,
    this.revenueGrowth,
    this.marketCap,
    this.eps,
    this.exchange,
    this.currentPrice,
    this.changePercent,
    this.changeAmount,
    this.dayHigh,
    this.dayLow,
    this.volume,
    this.avgVolume,
    this.fiftyTwoWeekHigh,
    this.fiftyTwoWeekLow,
  });

  factory Stock.fromJson(Map<String, dynamic> json) {
    return Stock(
      symbol: json['symbol'] ?? '',
      name: json['name'] ?? 'Unknown',
      sector: json['sector'] ?? 'N/A',
      peRatio: _parseDouble(json['pe_ratio']),
      pegRatio: _parseDouble(json['peg_ratio']),
      debtToFcf: _parseDouble(json['debt_to_fcf']),
      revenueGrowth: _parseDouble(json['revenue_growth']),
      marketCap: _parseDouble(json['market_cap']),
      eps: _parseDouble(json['eps']),
      exchange: json['exchange'],
      currentPrice: _parseDouble(json['current_price']),
      changePercent: _parseDouble(json['change_percent']),
      changeAmount: _parseDouble(json['change_amount']),
      dayHigh: _parseDouble(json['day_high']),
      dayLow: _parseDouble(json['day_low']),
      volume: _parseDouble(json['volume']),
      avgVolume: _parseDouble(json['avg_volume']),
      fiftyTwoWeekHigh: _parseDouble(json['52w_high']),
      fiftyTwoWeekLow: _parseDouble(json['52w_low']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'symbol': symbol,
      'name': name,
      'sector': sector,
      'pe_ratio': peRatio,
      'peg_ratio': pegRatio,
      'debt_to_fcf': debtToFcf,
      'revenue_growth': revenueGrowth,
      'market_cap': marketCap,
      'eps': eps,
      'exchange': exchange,
      'current_price': currentPrice,
      'change_percent': changePercent,
      'change_amount': changeAmount,
      'day_high': dayHigh,
      'day_low': dayLow,
      'volume': volume,
      'avg_volume': avgVolume,
      '52w_high': fiftyTwoWeekHigh,
      '52w_low': fiftyTwoWeekLow,
    };
  }

  static double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  bool get isGainer => (changePercent ?? 0) > 0;
  bool get isLoser => (changePercent ?? 0) < 0;
}
