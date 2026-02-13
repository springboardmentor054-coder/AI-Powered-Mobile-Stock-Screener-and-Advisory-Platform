import 'package:flutter/material.dart';
import 'dart:async';
import '../services/watchlist_service.dart';
import '../services/api_service.dart';
import '../models/stock_model.dart';
import 'stock_detail_screen.dart';

class WatchlistScreen extends StatefulWidget {
  const WatchlistScreen({super.key});

  @override
  State<WatchlistScreen> createState() => _WatchlistScreenState();
}

class _WatchlistScreenState extends State<WatchlistScreen> {
  List<String> _watchlistSymbols = [];
  Map<String, Map<String, dynamic>> _stockData = {};
  bool _isLoading = true;
  Timer? _refreshTimer;
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _loadWatchlist();
    _startAutoRefresh();
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  void _startAutoRefresh() {
    // Refresh every 30 seconds for real-time updates
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      _refreshPrices();
    });
  }

  Future<void> _loadWatchlist() async {
    setState(() => _isLoading = true);
    
    try {
      final symbols = await WatchlistService.getWatchlist();
      
      if (mounted) {
        setState(() {
          _watchlistSymbols = symbols;
          _isLoading = false;
        });

        if (symbols.isNotEmpty) {
          _refreshPrices();
        }
      }
    } catch (e) {
      print('Error loading watchlist: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading watchlist: ${e.toString()}'),
            backgroundColor: Colors.red,
            action: SnackBarAction(
              label: 'Retry',
              textColor: Colors.white,
              onPressed: _loadWatchlist,
            ),
          ),
        );
      }
    }
  }

  Future<void> _refreshPrices() async {
    if (_watchlistSymbols.isEmpty) return;

    // Fetch real-time data for all watchlist stocks
    final data = await _apiService.getBulkRealtimeData(_watchlistSymbols);
    
    if (data != null && mounted) {
      final Map<String, Map<String, dynamic>> newData = {};
      for (var item in data) {
        newData[item['symbol']] = item;
      }
      
      setState(() {
        _stockData = newData;
      });

      // Check for price alerts
      _checkPriceAlerts();
    }
  }

  void _checkPriceAlerts() {
    // Check for significant price changes and show notifications
    for (var entry in _stockData.entries) {
      final symbol = entry.key;
      final data = entry.value;
      final change = (data['change_percent'] as num?)?.toDouble() ?? 0.0;

      // Alert for changes > 5%
      if (change.abs() > 5.0) {
        _showPriceAlert(symbol, change);
      }
    }
  }

  void _showPriceAlert(String symbol, double changePercent) {
    if (!mounted) return;

    final isPositive = changePercent > 0;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              isPositive ? Icons.trending_up : Icons.trending_down,
              color: Colors.white,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                '$symbol ${isPositive ? 'up' : 'down'} ${changePercent.abs().toStringAsFixed(2)}%',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        backgroundColor: isPositive ? const Color(0xFF10B981) : const Color(0xFFEF4444),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  Future<void> _removeFromWatchlist(String symbol) async {
    await WatchlistService.removeFromWatchlist(symbol);
    await _loadWatchlist();
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('$symbol removed from watchlist'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Watchlist'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshPrices,
            tooltip: 'Refresh prices',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _watchlistSymbols.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadWatchlist,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _watchlistSymbols.length,
                    itemBuilder: (context, index) {
                      final symbol = _watchlistSymbols[index];
                      final data = _stockData[symbol];
                      return _buildWatchlistCard(symbol, data);
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.bookmark_border, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No stocks in watchlist',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.grey[700]),
          ),
          const SizedBox(height: 8),
          Text(
            'Add stocks to track their prices in real-time',
            style: TextStyle(fontSize: 14, color: Colors.grey[500]),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildWatchlistCard(String symbol, Map<String, dynamic>? data) {
    final currentPrice = (data?['current_price'] as num?)?.toDouble() ?? 0.0;
    final changeAmount = (data?['change_amount'] as num?)?.toDouble() ?? 0.0;
    final changePercent = (data?['change_percent'] as num?)?.toDouble() ?? 0.0;
    final isPositive = changeAmount >= 0;
    final isLoading = data == null;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      child: InkWell(
        onTap: isLoading ? null : () {
          // Navigate to stock details
          final stock = Stock(
            symbol: symbol,
            name: data['company_name'] ?? symbol,
            sector: data['sector'] ?? 'Unknown',
            currentPrice: currentPrice,
            changePercent: changePercent,
            changeAmount: changeAmount,
            marketCap: (data['market_cap'] as num?)?.toDouble() ?? 0.0,
            peRatio: (data['pe_ratio'] as num?)?.toDouble() ?? 0.0,
          );
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => StockDetailScreen(stock: stock),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Stock Icon
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isPositive
                        ? [const Color(0xFF10B981), const Color(0xFF34D399)]
                        : [const Color(0xFFEF4444), const Color(0xFFF87171)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    symbol.substring(0, 1),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),

              // Stock Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      symbol,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (isLoading)
                      const Text(
                        'Loading...',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      )
                    else
                      Text(
                        data['company_name'] ?? symbol,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),

              // Price Info
              if (!isLoading)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '₹${currentPrice.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isPositive
                            ? const Color(0xFF10B981).withValues(alpha: 0.1)
                            : const Color(0xFFEF4444).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isPositive ? Icons.arrow_upward : Icons.arrow_downward,
                            color: isPositive ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${changePercent.abs().toStringAsFixed(2)}%',
                            style: TextStyle(
                              color: isPositive ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

              // Remove button
              IconButton(
                icon: const Icon(Icons.close, size: 20),
                onPressed: () => _removeFromWatchlist(symbol),
                color: Colors.grey[600],
                tooltip: 'Remove from watchlist',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
