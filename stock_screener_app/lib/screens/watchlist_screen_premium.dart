import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../services/watchlist_api_service.dart';
import '../theme/premium_theme.dart';
import '../widgets/premium_card.dart';
import 'stock_detail_screen_premium.dart' show StockDetailScreen;

class WatchlistScreenPremium extends StatefulWidget {
  final int userId;

  const WatchlistScreenPremium({super.key, required this.userId});

  @override
  State<WatchlistScreenPremium> createState() => _WatchlistScreenPremiumState();
}

class _WatchlistScreenPremiumState extends State<WatchlistScreenPremium> {
  final WatchlistApiService _watchlistService = WatchlistApiService();
  final NumberFormat _compactNumber = NumberFormat.compact();

  List<Map<String, dynamic>> _watchlist = [];
  bool _isLoading = true;
  String? _error;
  DateTime? _lastUpdatedAt;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _loadWatchlist();
    _refreshTimer = Timer.periodic(
      const Duration(seconds: 25),
      (_) => _loadWatchlist(silent: true),
    );
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadWatchlist({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final watchlist = await _watchlistService.getWatchlist(widget.userId);
      if (!mounted) return;
      setState(() {
        _watchlist = watchlist;
        _isLoading = false;
        _error = null;
        _lastUpdatedAt = DateTime.now();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _removeFromWatchlist(String symbol) async {
    try {
      await _watchlistService.removeFromWatchlist(widget.userId, symbol);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('$symbol removed from watchlist'),
          backgroundColor: PremiumColors.profit,
          behavior: SnackBarBehavior.floating,
        ),
      );
      _loadWatchlist();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to remove $symbol'),
          backgroundColor: PremiumColors.loss,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFFBE8),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadWatchlist,
          color: PremiumColors.neonTeal,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
            children: [
              _buildHeader(),
              const SizedBox(height: 14),
              if (_isLoading)
                _buildLoadingState()
              else if (_error != null)
                _buildErrorState()
              else if (_watchlist.isEmpty)
                _buildEmptyState()
              else
                ..._watchlist.map(_buildStockCard),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return PremiumCard(
      backgroundColor: Colors.white,
      padding: const EdgeInsets.all(16),
      borderRadius: BorderRadius.circular(18),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: PremiumColors.primaryGradient,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.bookmark_rounded,
              color: Colors.white,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Watchlist', style: PremiumTypography.h3),
                const SizedBox(height: 2),
                Text(
                  '${_watchlist.length} stocks'
                  '${_lastUpdatedAt == null ? '' : ' • updated ${_formatElapsed(_lastUpdatedAt!)}'}',
                  style: PremiumTypography.caption.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: _isLoading ? null : _loadWatchlist,
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh',
          ),
        ],
      ),
    );
  }

  Widget _buildStockCard(Map<String, dynamic> stock) {
    final symbol = (stock['symbol']?.toString() ?? '').toUpperCase();
    final name = stock['name']?.toString() ?? 'Not Available';
    final sector = stock['sector']?.toString() ?? '';

    final currentPrice = _toDouble(stock['currentPrice']);
    final previousClose = _toDouble(
      stock['previousClose'],
      fallback: currentPrice,
    );
    final change = currentPrice - previousClose;
    final changePercent = previousClose == 0
        ? _toDouble(stock['changePercent'])
        : ((change / previousClose) * 100);
    final isPositive = change >= 0;
    final changeColor = isPositive ? PremiumColors.profit : PremiumColors.loss;

    final peRatio = _toNullableDouble(stock['peRatio']);
    final eps = _toNullableDouble(stock['eps']);
    final growth = _toNullableDouble(stock['revenueGrowth']);
    final marketCap = _toNullableDouble(stock['marketCap']);

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: PremiumCard(
        backgroundColor: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(16),
        padding: const EdgeInsets.all(14),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) =>
                  StockDetailScreen(symbol: symbol, stockData: stock),
            ),
          );
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    symbol,
                    style: PremiumTypography.caption.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                if (sector.isNotEmpty)
                  Flexible(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCEBFF),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        sector,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: PremiumTypography.caption.copyWith(
                          color: const Color(0xFF1D4ED8),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                const Spacer(),
                InkWell(
                  onTap: () => _showRemoveConfirmation(symbol),
                  borderRadius: BorderRadius.circular(20),
                  child: const Padding(
                    padding: EdgeInsets.all(4),
                    child: Icon(
                      Icons.close_rounded,
                      color: PremiumColors.loss,
                      size: 20,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: PremiumTypography.body1.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  currentPrice > 0
                      ? '₹${currentPrice.toStringAsFixed(2)}'
                      : '--',
                  style: PremiumTypography.priceMedium.copyWith(fontSize: 18),
                ),
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: changeColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${isPositive ? '+' : ''}${changePercent.toStringAsFixed(2)}%',
                    style: PremiumTypography.caption.copyWith(
                      color: changeColor,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const Spacer(),
                if (marketCap != null)
                  Text(
                    'MCap ${_compactNumber.format(marketCap)}',
                    style: PremiumTypography.caption.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (peRatio != null)
                  _metricChip('PE', peRatio.toStringAsFixed(1)),
                if (eps != null)
                  _metricChip('EPS', '₹${eps.toStringAsFixed(1)}'),
                if (growth != null)
                  _metricChip('Growth', '${growth.toStringAsFixed(1)}%'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _metricChip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFBFDBFE)),
      ),
      child: Text(
        '$label $value',
        style: PremiumTypography.caption.copyWith(
          color: PremiumColors.textSecondary,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Padding(
      padding: EdgeInsets.only(top: 30),
      child: Center(
        child: CircularProgressIndicator(color: PremiumColors.neonTeal),
      ),
    );
  }

  Widget _buildErrorState() {
    return PremiumCard(
      backgroundColor: Colors.white,
      padding: const EdgeInsets.all(16),
      borderRadius: BorderRadius.circular(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Unable to load watchlist',
            style: PremiumTypography.body1.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(_error ?? '', style: PremiumTypography.caption),
          const SizedBox(height: 10),
          ElevatedButton.icon(
            onPressed: _loadWatchlist,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return PremiumCard(
      backgroundColor: Colors.white,
      padding: const EdgeInsets.all(20),
      borderRadius: BorderRadius.circular(16),
      child: Column(
        children: [
          const Icon(
            Icons.bookmark_border_rounded,
            color: PremiumColors.textMuted,
            size: 48,
          ),
          const SizedBox(height: 10),
          Text(
            'Your watchlist is empty',
            style: PremiumTypography.body1.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Run the screener and save stocks to track them here.',
            textAlign: TextAlign.center,
            style: PremiumTypography.caption,
          ),
        ],
      ),
    );
  }

  Future<void> _showRemoveConfirmation(String symbol) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Remove from Watchlist'),
        content: Text('Remove $symbol from your watchlist?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: PremiumColors.loss,
            ),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      _removeFromWatchlist(symbol);
    }
  }

  double _toDouble(dynamic value, {double fallback = 0.0}) {
    if (value == null) return fallback;
    if (value is num) return value.toDouble();
    if (value is String) {
      return double.tryParse(value.replaceAll(',', '').trim()) ?? fallback;
    }
    return fallback;
  }

  double? _toNullableDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    if (value is String) {
      return double.tryParse(value.replaceAll(',', '').trim());
    }
    return null;
  }

  String _formatElapsed(DateTime value) {
    final diff = DateTime.now().difference(value);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s ago';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    return '${diff.inHours}h ago';
  }
}
