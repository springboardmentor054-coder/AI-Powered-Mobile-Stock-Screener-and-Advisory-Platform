import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/stock_model.dart';

class MarketDataService {
  // Using Alpha Vantage API (free tier available)
  // Get your free API key at: https://www.alphavantage.co/support/#api-key
  static const String _apiKey = 'demo'; // Replace with your actual API key
  static const String _baseUrl = 'https://www.alphavantage.co/query';

  /// Fetch real-time stock quote
  static Future<Map<String, dynamic>> getStockQuote(String symbol) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl?function=GLOBAL_QUOTE&symbol=$symbol&apikey=$_apiKey'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final quote = data['Global Quote'];
        
        if (quote != null && quote.isNotEmpty) {
          return {
            'symbol': symbol,
            'current_price': double.tryParse(quote['05. price'] ?? '0'),
            'change_amount': double.tryParse(quote['09. change'] ?? '0'),
            'change_percent': double.tryParse(
              (quote['10. change percent'] ?? '0').toString().replaceAll('%', '')
            ),
            'volume': double.tryParse(quote['06. volume'] ?? '0'),
            'day_high': double.tryParse(quote['03. high'] ?? '0'),
            'day_low': double.tryParse(quote['04. low'] ?? '0'),
          };
        }
      }
      
      // Return mock data if API fails (for demo purposes)
      return _getMockQuote(symbol);
    } catch (e) {
      print('Error fetching quote for $symbol: $e');
      return _getMockQuote(symbol);
    }
  }

  /// Fetch intraday stock data for charts
  static Future<List<Map<String, dynamic>>> getIntradayData(String symbol) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl?function=TIME_SERIES_INTRADAY&symbol=$symbol&interval=5min&apikey=$_apiKey'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final timeSeries = data['Time Series (5min)'] as Map<String, dynamic>?;
        
        if (timeSeries != null) {
          final chartData = <Map<String, dynamic>>[];
          
          timeSeries.forEach((time, values) {
            chartData.add({
              'time': time,
              'price': double.tryParse(values['4. close'] ?? '0') ?? 0,
              'volume': double.tryParse(values['5. volume'] ?? '0') ?? 0,
            });
          });
          
          return chartData.take(50).toList(); // Last 50 data points
        }
      }
      
      return _getMockChartData(symbol);
    } catch (e) {
      print('Error fetching intraday data for $symbol: $e');
      return _getMockChartData(symbol);
    }
  }

  /// Get market overview (top gainers, losers, most active)
  static Future<Map<String, List<Stock>>> getMarketOverview() async {
    try {
      // For demo, we'll use mock data
      // In production, you can use: 
      // - Yahoo Finance API
      // - Finnhub API
      // - IEX Cloud API
      return {
        'gainers': _getMockGainers(),
        'losers': _getMockLosers(),
        'mostActive': _getMockMostActive(),
      };
    } catch (e) {
      print('Error fetching market overview: $e');
      return {
        'gainers': [],
        'losers': [],
        'mostActive': [],
      };
    }
  }

  /// Mock data generators (for demo purposes)
  static Map<String, dynamic> _getMockQuote(String symbol) {
    final basePrice = 100 + (symbol.hashCode % 500);
    final change = -10 + (symbol.hashCode % 20);
    
    return {
      'symbol': symbol,
      'current_price': basePrice.toDouble(),
      'change_amount': change.toDouble(),
      'change_percent': (change / basePrice * 100),
      'volume': 1000000 + (symbol.hashCode % 5000000).toDouble(),
      'day_high': (basePrice + 5).toDouble(),
      'day_low': (basePrice - 5).toDouble(),
    };
  }

  static List<Map<String, dynamic>> _getMockChartData(String symbol) {
    final basePrice = 100 + (symbol.hashCode % 500);
    final data = <Map<String, dynamic>>[];
    
    for (int i = 50; i >= 0; i--) {
      final variation = -10 + (i % 20);
      data.add({
        'time': DateTime.now().subtract(Duration(minutes: i * 5)).toIso8601String(),
        'price': (basePrice + variation).toDouble(),
        'volume': (1000000 + (i * 10000)).toDouble(),
      });
    }
    
    return data;
  }

  static List<Stock> _getMockGainers() {
    return [
      Stock(
        symbol: 'TECHM',
        name: 'Tech Mahindra',
        sector: 'IT',
        currentPrice: 1250.50,
        changePercent: 5.8,
        changeAmount: 68.50,
        marketCap: 280000000000,
        peRatio: 21.5,
      ),
      Stock(
        symbol: 'WIPRO',
        name: 'Wipro Limited',
        sector: 'IT',
        currentPrice: 425.30,
        changePercent: 4.2,
        changeAmount: 17.15,
        marketCap: 320000000000,
        peRatio: 22.4,
      ),
      Stock(
        symbol: 'HCLTECH',
        name: 'HCL Technologies',
        sector: 'IT',
        currentPrice: 1580.75,
        changePercent: 3.5,
        changeAmount: 53.25,
        marketCap: 450000000000,
        peRatio: 24.3,
      ),
    ];
  }

  static List<Stock> _getMockLosers() {
    return [
      Stock(
        symbol: 'SBIN',
        name: 'State Bank of India',
        sector: 'Finance',
        currentPrice: 625.40,
        changePercent: -2.8,
        changeAmount: -18.00,
        marketCap: 480000000000,
        peRatio: 12.3,
      ),
      Stock(
        symbol: 'ICICIBANK',
        name: 'ICICI Bank',
        sector: 'Finance',
        currentPrice: 1025.60,
        changePercent: -1.5,
        changeAmount: -15.60,
        marketCap: 620000000000,
        peRatio: 16.8,
      ),
    ];
  }

  static List<Stock> _getMockMostActive() {
    return [
      Stock(
        symbol: 'TCS',
        name: 'Tata Consultancy Services',
        sector: 'IT',
        currentPrice: 3850.25,
        changePercent: 1.2,
        changeAmount: 45.60,
        marketCap: 1200000000000,
        peRatio: 28.5,
        volume: 5000000,
      ),
      Stock(
        symbol: 'INFY',
        name: 'Infosys Limited',
        sector: 'IT',
        currentPrice: 1620.80,
        changePercent: 0.8,
        changeAmount: 12.80,
        marketCap: 650000000000,
        peRatio: 26.8,
        volume: 4500000,
      ),
      Stock(
        symbol: 'HDFCBANK',
        name: 'HDFC Bank',
        sector: 'Finance',
        currentPrice: 1685.50,
        changePercent: -0.3,
        changeAmount: -5.10,
        marketCap: 850000000000,
        peRatio: 18.5,
        volume: 3800000,
      ),
    ];
  }
}
