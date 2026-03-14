import 'package:flutter/material.dart';
import '../services/wishlist_service.dart';

class WishlistScreen extends StatefulWidget {
  const WishlistScreen({super.key});

  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  final WishlistService _wishlistService = WishlistService();
  
  List<dynamic> _wishlist = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadWishlist();
  }

  // Helper to safely convert any value to num
  num? _toNum(dynamic value) {
    if (value == null) return null;
    if (value is num) return value;
    if (value is String) return num.tryParse(value);
    return null;
  }

  // Helper to safely convert any value to double
  double? _toDouble(dynamic value) {
    final n = _toNum(value);
    return n?.toDouble();
  }

  Future<void> _loadWishlist() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final wishlist = await _wishlistService.getWishlist();
      setState(() {
        _wishlist = wishlist;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _removeFromWishlist(String symbol) async {
    try {
      await _wishlistService.removeFromWishlist(symbol);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$symbol removed from wishlist'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        _loadWishlist();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _showStockDetails(Map<String, dynamic> stock) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, controller) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          padding: const EdgeInsets.all(24),
          child: ListView(
            controller: controller,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          stock['symbol'] ?? '',
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF667EEA),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          stock['company_name'] ?? 'Unknown Company',
                          style: const TextStyle(
                            fontSize: 16,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 28),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(height: 32),

              // Price Information Section
              if (stock['current_price'] != null || stock['yesterday_price'] != null) ...[
                const Text(
                  'Price Information',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF667EEA),
                  ),
                ),
                const SizedBox(height: 12),
                _buildDetailRow('Current Price', _toDouble(stock['current_price']) != null ? '\$${_toDouble(stock['current_price'])!.toStringAsFixed(2)}' : null),
                _buildDetailRow('Yesterday Price', _toDouble(stock['yesterday_price']) != null ? '\$${_toDouble(stock['yesterday_price'])!.toStringAsFixed(2)}' : null),
                if (stock['price_change'] != null) ...[
                  _buildPriceChangeDetailRow('Price Change', stock['price_change'], stock['price_change_percentage']),
                ],
                if (_toDouble(stock['today_open']) != null) _buildDetailRow('Today Open', '\$${_toDouble(stock['today_open'])!.toStringAsFixed(2)}'),
                if (_toDouble(stock['today_high']) != null) _buildDetailRow('Today High', '\$${_toDouble(stock['today_high'])!.toStringAsFixed(2)}'),
                if (_toDouble(stock['today_low']) != null) _buildDetailRow('Today Low', '\$${_toDouble(stock['today_low'])!.toStringAsFixed(2)}'),
                if (stock['today_volume'] != null) _buildDetailRow('Volume', _formatVolume(stock['today_volume'])),
                if (stock['volume_change_percentage'] != null) _buildVolumeChangeRow('Volume Change', stock['volume_change_percentage']),
                const Divider(height: 32),
              ],

              // Fundamental Details
              const Text(
                'Fundamentals',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF667EEA),
                ),
              ),
              const SizedBox(height: 12),
              _buildDetailRow('Sector', stock['sector']),
              _buildDetailRow('Industry', stock['industry']),
              _buildDetailRow('Exchange', stock['exchange']),
              _buildDetailRow('P/E Ratio', _formatPERatio(stock)),
              _buildDetailRow('P/B Ratio', stock['pb_ratio']?.toStringAsFixed(2)),
              _buildDetailRow('EPS', stock['eps'] != null ? '\$${stock['eps'].toStringAsFixed(2)}' : null),
              _buildDetailRow('Profit Margin', stock['profit_margin'] != null ? '${(stock['profit_margin'] * 100).toStringAsFixed(2)}%' : null),
              _buildDetailRow('Dividend Yield', stock['dividend_yield'] != null ? '${(stock['dividend_yield'] * 100).toStringAsFixed(2)}%' : null),
              _buildDetailRow('Beta', stock['beta']?.toStringAsFixed(2)),
              const Divider(height: 32),
              _buildDetailRow('Added to Wishlist', _formatDate(stock['added_at'])),
              
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  _removeFromWishlist(stock['symbol']);
                },
                icon: const Icon(Icons.delete),
                label: const Text('Remove from Wishlist'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, dynamic value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
          ),
          Text(
            value?.toString() ?? 'N/A',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  String _formatPERatio(Map<String, dynamic> stock) {
    final peValue = _toDouble(stock['pe_ratio']);
    final eps = _toDouble(stock['eps']);
    
    if (peValue != null) {
      // Ensure proper rounding to 2 decimal places
      return peValue.toStringAsFixed(2);
    }
    
    if (eps != null && eps < 0) {
      return 'N/A (Company in loss)';
    }
    
    return 'N/A';
  }

  String _formatDate(dynamic date) {
    if (date == null) return 'N/A';
    try {
      final parsedDate = DateTime.parse(date.toString());
      return '${parsedDate.day}/${parsedDate.month}/${parsedDate.year}';
    } catch (e) {
      return 'N/A';
    }
  }

  String _formatVolume(dynamic volume) {
    if (volume == null) return 'N/A';
    try {
      final vol = int.parse(volume.toString());
      if (vol >= 1000000000) {
        return '${(vol / 1000000000).toStringAsFixed(2)}B';
      } else if (vol >= 1000000) {
        return '${(vol / 1000000).toStringAsFixed(2)}M';
      } else if (vol >= 1000) {
        return '${(vol / 1000).toStringAsFixed(2)}K';
      }
      return vol.toString();
    } catch (e) {
      return 'N/A';
    }
  }

  Widget _buildPriceChangeDetailRow(String label, dynamic change, dynamic changePct) {
    final changeValue = _toDouble(change);
    if (changeValue == null) return const SizedBox.shrink();
    
    final isPositive = changeValue >= 0;
    final color = isPositive ? Colors.green : Colors.red;
    final icon = isPositive ? Icons.arrow_upward : Icons.arrow_downward;
    
    final changePctValue = _toDouble(changePct);
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
          ),
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 4),
              Text(
                '${isPositive ? '+' : ''}\$${changeValue.toStringAsFixed(2)} (${changePctValue?.toStringAsFixed(2) ?? '0.00'}%)',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildVolumeChangeRow(String label, dynamic changePct) {
    final changePctValue = _toDouble(changePct);
    if (changePctValue == null) return const SizedBox.shrink();
    
    final isPositive = changePctValue >= 0;
    final color = isPositive ? Colors.green : Colors.red;
    final icon = isPositive ? Icons.arrow_upward : Icons.arrow_downward;
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
          ),
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 4),
              Text(
                '${isPositive ? '+' : ''}${changePctValue.toStringAsFixed(2)}%',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPriceChangeWidget(Map<String, dynamic> stock) {
    final currentPrice = _toDouble(stock['current_price'] ?? stock['today_price']);
    final yesterdayPrice = _toDouble(stock['yesterday_price']);
    final priceChange = _toDouble(stock['price_change']);
    final priceChangePct = _toDouble(stock['price_change_percentage']);
    
    // If we have current price but no yesterday data
    if (currentPrice != null && yesterdayPrice == null) {
      return Row(
        children: [
          Text(
            '\$${currentPrice.toStringAsFixed(2)}',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1E3A8A),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Text(
              'Waiting for prior close',
              style: TextStyle(
                fontSize: 10,
                color: Color(0xFF64748B),
              ),
            ),
          ),
        ],
      );
    }
    
    // If we have both current and yesterday prices
    if (currentPrice != null && yesterdayPrice != null) {
      final change = priceChange ?? (currentPrice - yesterdayPrice);
      final changePct = priceChangePct ?? ((change / yesterdayPrice) * 100);
      final isPositive = change >= 0;
      final color = isPositive ? Colors.green : Colors.red;
      final icon = isPositive ? Icons.arrow_upward : Icons.arrow_downward;
      
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                '\$${currentPrice.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E3A8A),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  children: [
                    Icon(icon, size: 12, color: color),
                    const SizedBox(width: 2),
                    Text(
                      '${isPositive ? '+' : ''}${change.toStringAsFixed(2)} (${changePct.toStringAsFixed(2)}%)',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: color,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            'Prev close: \$${yesterdayPrice.toStringAsFixed(2)}',
            style: TextStyle(
              fontSize: 10,
              color: Colors.grey[500],
            ),
          ),
        ],
      );
    }
    
    // No price data available
    return Text(
      'Price: N/A',
      style: TextStyle(
        fontSize: 12,
        color: Colors.grey[500],
      ),
    );
  }

  Widget _buildMetaChip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: Color(0xFF1E3A8A),
        ),
      ),
    );
  }

  void _showComparisonAnalysis() {
    if (_wishlist.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Add stocks to wishlist to compare them'),
          backgroundColor: Colors.orange,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, controller) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF667EEA), Color(0xFF764BA2)],
                  ),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Portfolio Analysis',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Compare your wishlisted stocks',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white70,
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white, size: 28),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              // Content
              Expanded(
                child: ListView(
                  controller: controller,
                  padding: const EdgeInsets.all(20),
                  children: [
                    _buildPerformanceSection(),
                    const SizedBox(height: 24),
                    _buildValuationSection(),
                    const SizedBox(height: 24),
                    _buildTopPerformersSection(),
                    const SizedBox(height: 24),
                    _buildRecommendationsSection(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showStockAnalysis(Map<String, dynamic> stock) {
    final currentPrice = stock['current_price'] ?? stock['today_price'];
    final yesterdayPrice = stock['yesterday_price'];
    // Show comparison if we have at least two price points (snapshot or fallback)
    final hasData = currentPrice != null && yesterdayPrice != null;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, controller) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Header with gradient
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF667EEA), Color(0xFF764BA2)],
                  ),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            stock['symbol'] ?? '',
                            style: const TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            stock['company_name'] ?? 'Unknown Company',
                            style: const TextStyle(
                              fontSize: 16,
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white, size: 28),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              // Content
              Expanded(
                child: ListView(
                  controller: controller,
                  padding: const EdgeInsets.all(20),
                  children: [
                    if (!hasData) ...[
                      const Card(
                        child: Padding(
                          padding: EdgeInsets.all(20),
                          child: Column(
                            children: [
                              Icon(Icons.info_outline, size: 48, color: Colors.blue),
                              SizedBox(height: 16),
                              Text(
                                'Not enough price history',
                                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'We need at least two price points to show comparisons.',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ] else ...[
                      _buildPriceComparisonCard(stock),
                      const SizedBox(height: 16),
                      _buildDailyChangesCard(stock),
                      const SizedBox(height: 16),
                      _buildTradingActivityCard(stock),
                      const SizedBox(height: 16),
                      _buildInsightsSummaryCard(stock),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPriceComparisonCard(Map<String, dynamic> stock) {
    final currentPrice = _toDouble(stock['current_price'] ?? stock['today_price']);
    final yesterdayPrice = _toDouble(stock['yesterday_price']);
    
    // Calculate price change if not provided by backend
    final priceChange = _toDouble(stock['price_change']) ?? 
      (currentPrice != null && yesterdayPrice != null 
        ? currentPrice - yesterdayPrice 
        : 0.0);
    
    final priceChangePct = _toDouble(stock['price_change_percentage']) ??
      (currentPrice != null && yesterdayPrice != null && yesterdayPrice != 0
        ? ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100
        : 0.0);
    
    // Use the safe converted values
    final priceChangeValue = priceChange;
    final priceChangePctValue = priceChangePct;
    final currentPriceValue = currentPrice;
    final yesterdayPriceValue = yesterdayPrice;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.compare_arrows, color: Color(0xFF667EEA)),
                const SizedBox(width: 8),
                const Text(
                  'Price Comparison',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF667EEA),
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildPriceColumn('Prev close', yesterdayPriceValue, Colors.grey),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: (priceChangeValue ?? 0) >= 0 ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        (priceChangeValue ?? 0) >= 0 ? Icons.arrow_upward : Icons.arrow_downward,
                        color: (priceChangeValue ?? 0) >= 0 ? Colors.green : Colors.red,
                        size: 24,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${(priceChangeValue ?? 0) >= 0 ? '+' : ''}\$${(priceChangeValue ?? 0).toStringAsFixed(2)}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: (priceChangeValue ?? 0) >= 0 ? Colors.green : Colors.red,
                        ),
                      ),
                      Text(
                        '${(priceChangePctValue ?? 0).toStringAsFixed(2)}%',
                        style: TextStyle(
                          fontSize: 12,
                          color: (priceChangeValue ?? 0) >= 0 ? Colors.green : Colors.red,
                        ),
                      ),
                    ],
                  ),
                ),
                _buildPriceColumn('Latest', currentPriceValue, const Color(0xFF667EEA)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceColumn(String label, dynamic price, Color color) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
        ),
        const SizedBox(height: 8),
        Text(
          '\$${price?.toStringAsFixed(2) ?? 'N/A'}',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildDailyChangesCard(Map<String, dynamic> stock) {
    final changes = <Map<String, dynamic>>[];

    // Only show P/E comparison if we have actual today and yesterday snapshots
    final hasYesterdayData = stock['yesterday_date'] != null;
    final hasTodayData = stock['today_date'] != null;

    final currentPrice = _toDouble(stock['current_price'] ?? stock['today_price']);
    final previousPrice = _toDouble(stock['yesterday_price']);
    if (currentPrice != null && previousPrice != null && previousPrice != 0) {
      final change = _toDouble(stock['price_change']) ?? (currentPrice - previousPrice);
      final changePct = _toDouble(stock['price_change_percentage']) ?? ((change / previousPrice) * 100);
      changes.add({
        'label': 'Price',
        'yesterday': '\$${previousPrice.toStringAsFixed(2)}',
        'today': '\$${currentPrice.toStringAsFixed(2)}',
        'change': changePct,
        'isPercentage': true,
        'isPositive': change >= 0,
      });
    }

    if (stock['pe_ratio'] != null && stock['yesterday_pe_ratio'] != null && hasYesterdayData) {
      final peToday = _toDouble(stock['pe_ratio']);
      final peYesterday = _toDouble(stock['yesterday_pe_ratio']);
      if (peToday != null && peYesterday != null) {
        final change = peToday - peYesterday;
        changes.add({
          'label': 'P/E Ratio',
          'yesterday': peYesterday.toStringAsFixed(2),
          'today': peToday.toStringAsFixed(2),
          'change': change,
          'isPositive': change >= 0,
        });
      }
    }

    final todayVol = _toDouble(stock['today_volume'] ?? stock['latest_volume']);
    final yesterdayVol = _toDouble(stock['yesterday_volume'] ?? stock['previous_volume']);
    if (todayVol != null && yesterdayVol != null && yesterdayVol != 0) {
      final change = _toDouble(stock['volume_change_percentage']) ??
        ((todayVol - yesterdayVol) / yesterdayVol) * 100;
      changes.add({
        'label': 'Volume',
        'yesterday': _formatVolume(yesterdayVol),
        'today': _formatVolume(todayVol),
        'change': change,
        'isPercentage': true,
        'isPositive': change >= 0,
      });
    }

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.insights, color: Color(0xFF667EEA)),
                const SizedBox(width: 8),
                const Text(
                  'Recent Changes',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF667EEA),
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            if (changes.isEmpty)
              const Text('Limited change data available', style: TextStyle(color: Colors.grey))
            else
              ...changes.map((c) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _buildChangeRow(c),
              )),
          ],
        ),
      ),
    );
  }

  Widget _buildChangeRow(Map<String, dynamic> data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(data['label'], style: const TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Previous', style: TextStyle(fontSize: 12, color: Colors.grey)),
                // Parse and format yesterday value
                Text(
                  data['yesterday'] is String 
                    ? data['yesterday']
                    : data['yesterday'].toString(),
                  style: const TextStyle(fontSize: 14),
                ),
              ],
            ),
            Icon(
              data['isPositive'] ? Icons.arrow_forward : Icons.arrow_forward,
              color: data['isPositive'] ? Colors.green : Colors.red,
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const Text('Latest', style: TextStyle(fontSize: 12, color: Colors.grey)),
                // Parse and format today value
                Text(
                  data['today'] is String 
                    ? data['today']
                    : data['today'].toString(),
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: (data['isPositive'] ? Colors.green : Colors.red).withOpacity(0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                '${data['isPositive'] ? '+' : ''}${data['change']?.toStringAsFixed(2)}${data['isPercentage'] == true ? '%' : ''}',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: data['isPositive'] ? Colors.green : Colors.red,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTradingActivityCard(Map<String, dynamic> stock) {
    final todayOpen = _toDouble(stock['today_open'] ?? stock['latest_open']);
    final currentPrice = _toDouble(stock['current_price']);
    final previousPrice = _toDouble(stock['yesterday_price']);
    final todayHigh = _toDouble(stock['today_high'] ?? stock['latest_high']);
    final todayLow = _toDouble(stock['today_low'] ?? stock['latest_low']);
    final todayVolume = stock['today_volume'] ?? stock['latest_volume'];
    final usingHistoryFallback = stock['today_date'] == null && stock['latest_date'] != null;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.bar_chart, color: Color(0xFF667EEA)),
                const SizedBox(width: 8),
                const Text(
                  'Recent Trading',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF667EEA),
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            if (todayOpen != null) 
              _buildInfoRow('Open', '\$${todayOpen.toStringAsFixed(2)}')
            else if (currentPrice != null)
              _buildInfoRow('Current Price', '\$${currentPrice.toStringAsFixed(2)}'),
            if (previousPrice != null)
              _buildInfoRow('Prev Close', '\$${previousPrice.toStringAsFixed(2)}'),
            if (todayHigh != null) 
              _buildInfoRow('High', '\$${todayHigh.toStringAsFixed(2)}'),
            if (todayLow != null) 
              _buildInfoRow('Low', '\$${todayLow.toStringAsFixed(2)}'),
            if (todayVolume != null) 
              _buildInfoRow('Volume', _formatVolume(todayVolume))
            else
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text(
                  'Detailed trading data will be available after daily snapshot',
                  style: TextStyle(color: Colors.grey, fontSize: 12, fontStyle: FontStyle.italic),
                ),
              ),
            if (usingHistoryFallback)
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text(
                  'Showing latest available price history',
                  style: TextStyle(color: Colors.grey, fontSize: 12, fontStyle: FontStyle.italic),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600])),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildInsightsSummaryCard(Map<String, dynamic> stock) {
    final insights = <String>[];
    final currentPrice = _toDouble(stock['current_price'] ?? stock['today_price']);
    final previousPrice = _toDouble(stock['yesterday_price']);
    final priceChangeValue = _toDouble(stock['price_change_percentage']) ??
      (currentPrice != null && previousPrice != null && previousPrice != 0
        ? ((currentPrice - previousPrice) / previousPrice) * 100
        : 0.0);
    final todayVol = _toDouble(stock['today_volume'] ?? stock['latest_volume']);
    final yesterdayVol = _toDouble(stock['yesterday_volume'] ?? stock['previous_volume']);
    final volumeChangeValue = _toDouble(stock['volume_change_percentage']) ??
      (todayVol != null && yesterdayVol != null && yesterdayVol != 0
        ? ((todayVol - yesterdayVol) / yesterdayVol) * 100
        : 0.0);

    // Price movement insights
    if (priceChangeValue > 5) {
      insights.add('📈 Strong upward movement with ${priceChangeValue.toStringAsFixed(2)}% gain');
    } else if (priceChangeValue > 2) {
      insights.add('📊 Moderate positive movement');
    } else if (priceChangeValue < -5) {
      insights.add('📉 Significant decline of ${priceChangeValue.abs().toStringAsFixed(2)}%');
    } else if (priceChangeValue < -2) {
      insights.add('⚠️ Moderate negative movement');
    } else {
      insights.add('➡️ Relatively stable price movement');
    }

    // Volume insights
    if (volumeChangeValue > 50) {
      insights.add('🔥 High trading activity with ${volumeChangeValue.toStringAsFixed(0)}% volume increase');
    } else if (volumeChangeValue < -30) {
      insights.add('📊 Lower trading activity today');
    }

    // P/E insights
    final peValue = _toDouble(stock['pe_ratio']);
    if (peValue != null) {
      if (peValue > 40) {
        insights.add('⚠️ High P/E ratio (${peValue.toStringAsFixed(2)}) - may be overvalued');
      } else if (peValue < 15 && peValue > 0) {
        insights.add('💡 Low P/E ratio (${peValue.toStringAsFixed(2)}) - potentially undervalued');
      }
    }

    return Card(
      elevation: 2,
      color: const Color(0xFFF0F4FF),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.lightbulb, color: Color(0xFF667EEA)),
                const SizedBox(width: 8),
                const Text(
                  'AI Insights',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF667EEA),
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            ...insights.map((insight) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      insight,
                      style: const TextStyle(fontSize: 14, height: 1.5),
                    ),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildPerformanceSection() {
    final stocksWithChange = _wishlist.where((s) => s['price_change_percentage'] != null).toList();
    
    if (stocksWithChange.isEmpty) {
      return _buildAnalysisCard(
        'Performance Overview',
        Icons.trending_up,
        const Text('Waiting for daily data to show performance comparison'),
      );
    }

    final avgChange = stocksWithChange.fold<double>(0, (sum, s) {
      final changeValue = _toDouble(s['price_change_percentage']) ?? 0.0;
      return sum + changeValue;
    }) / stocksWithChange.length;
    
    final gainers = stocksWithChange.where((s) {
      final changeValue = _toDouble(s['price_change_percentage']) ?? 0.0;
      return changeValue > 0;
    }).length;
    
    final losers = stocksWithChange.where((s) {
      final changeValue = _toDouble(s['price_change_percentage']) ?? 0.0;
      return changeValue < 0;
    }).length;

    return _buildAnalysisCard(
      'Performance Overview',
      Icons.trending_up,
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStatRow('Average Daily Change', '${avgChange.toStringAsFixed(2)}%', avgChange >= 0 ? Colors.green : Colors.red),
          const Divider(height: 20),
          _buildStatRow('Gainers', '$gainers stocks', Colors.green),
          _buildStatRow('Losers', '$losers stocks', Colors.red),
          _buildStatRow('Unchanged', '${stocksWithChange.length - gainers - losers} stocks', Colors.grey),
        ],
      ),
    );
  }

  Widget _buildValuationSection() {
    final stocksWithPE = _wishlist.where((s) => s['pe_ratio'] != null && s['pe_ratio'] > 0).toList();
    
    if (stocksWithPE.isEmpty) {
      return _buildAnalysisCard(
        'Valuation Metrics',
        Icons.attach_money,
        const Text('No P/E ratio data available for comparison'),
      );
    }

    // Ensure all PE ratios are converted to double for proper calculation
    final avgPE = stocksWithPE.fold<double>(0, (sum, s) {
      final peValue = _toDouble(s['pe_ratio']) ?? 0.0;
      return sum + peValue;
    }) / stocksWithPE.length;
    
    final overvalued = stocksWithPE.where((s) {
      final peValue = _toDouble(s['pe_ratio']) ?? 0.0;
      return peValue > 30;
    }).length;
    
    final undervalued = stocksWithPE.where((s) {
      final peValue = _toDouble(s['pe_ratio']) ?? 0.0;
      return peValue < 15;
    }).length;

    return _buildAnalysisCard(
      'Valuation Metrics',
      Icons.attach_money,
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStatRow('Average P/E Ratio', avgPE.toStringAsFixed(2), Colors.blue),
          const Divider(height: 20),
          _buildStatRow('Potentially Overvalued (P/E > 30)', '$overvalued stocks', Colors.orange),
          _buildStatRow('Potentially Undervalued (P/E < 15)', '$undervalued stocks', Colors.green),
        ],
      ),
    );
  }

  Widget _buildTopPerformersSection() {
    final stocksWithChange = _wishlist.where((s) => s['price_change_percentage'] != null).toList();
    
    if (stocksWithChange.isEmpty) {
      return _buildAnalysisCard(
        'Top & Bottom Performers',
        Icons.star,
        const Text('Waiting for daily data to show performers'),
      );
    }

    stocksWithChange.sort((a, b) {
      final aValue = _toDouble(a['price_change_percentage']) ?? 0.0;
      final bValue = _toDouble(b['price_change_percentage']) ?? 0.0;
      return bValue.compareTo(aValue);
    });
    final topPerformers = stocksWithChange.take(3).toList();
    final bottomPerformers = stocksWithChange.reversed.take(3).toList();

    return _buildAnalysisCard(
      'Top & Bottom Performers',
      Icons.star,
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('🏆 Top Performers', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          ...topPerformers.map((s) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _buildPerformerRow(s, true),
          )),
          const Divider(height: 24),
          const Text('📉 Needs Attention', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          ...bottomPerformers.map((s) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _buildPerformerRow(s, false),
          )),
        ],
      ),
    );
  }

  Widget _buildRecommendationsSection() {
    final recommendations = <String>[];
    
    // Analyze and give recommendations
    final highPEStocks = _wishlist.where((s) {
      final peValue = _toDouble(s['pe_ratio']) ?? 0.0;
      return peValue > 40;
    }).length;
    
    final negativeTrendStocks = _wishlist.where((s) {
      final priceChangeValue = _toDouble(s['price_change_percentage']) ?? 0.0;
      return priceChangeValue < -5;
    }).length;
    
    if (highPEStocks > 0) {
      recommendations.add('⚠️ You have $highPEStocks stock${highPEStocks > 1 ? 's' : ''} with high P/E (>40). Consider reviewing valuation.');
    }
    
    if (negativeTrendStocks > 0) {
      recommendations.add('📉 $negativeTrendStocks stock${negativeTrendStocks > 1 ? 's have' : ' has'} declined >5% today. Monitor closely.');
    }
    
    final diversificationSectors = _wishlist.map((s) => s['sector']).toSet().length;
    if (diversificationSectors < 3 && _wishlist.length > 3) {
      recommendations.add('🎯 Consider diversifying across more sectors. Currently tracking $diversificationSectors sector${diversificationSectors > 1 ? 's' : ''}.');
    }
    
    if (recommendations.isEmpty) {
      recommendations.add('✅ Your wishlist looks well-balanced!');
      recommendations.add('💡 Keep monitoring daily changes and maintain diversification.');
    }

    return _buildAnalysisCard(
      'Recommendations',
      Icons.lightbulb,
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: recommendations.map((r) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Text(r, style: const TextStyle(fontSize: 14, height: 1.5)),
        )).toList(),
      ),
    );
  }

  Widget _buildAnalysisCard(String title, IconData icon, Widget content) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: const Color(0xFF667EEA)),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF667EEA),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            content,
          ],
        ),
      ),
    );
  }

  Widget _buildStatRow(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 14)),
          Text(
            value,
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: color),
          ),
        ],
      ),
    );
  }

  Widget _buildPerformerRow(Map<String, dynamic> stock, bool isTop) {
    final changeValue = _toDouble(stock['price_change_percentage']) ?? 0.0;
    final isPositive = changeValue >= 0;
    
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                stock['symbol'] ?? '',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(
                stock['company_name'] ?? '',
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: (isPositive ? Colors.green : Colors.red).withOpacity(0.1),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Row(
            children: [
              Icon(
                isPositive ? Icons.arrow_upward : Icons.arrow_downward,
                size: 14,
                color: isPositive ? Colors.green : Colors.red,
              ),
              const SizedBox(width: 4),
              Text(
                '${changeValue.toStringAsFixed(2)}%',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: isPositive ? Colors.green : Colors.red,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('My Wishlist'),
        backgroundColor: const Color(0xFF667EEA),
        foregroundColor: Colors.white,
        actions: [
          if (_wishlist.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.analytics),
              onPressed: _showComparisonAnalysis,
              tooltip: 'Compare & Analyze',
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadWishlist,
          ),
        ],
      ),
      floatingActionButton: _wishlist.isNotEmpty
          ? FloatingActionButton.extended(
              onPressed: _showComparisonAnalysis,
              backgroundColor: const Color(0xFF667EEA),
              icon: const Icon(Icons.analytics),
              label: const Text('Analyze'),
            )
          : null,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(
                        _error!,
                        style: const TextStyle(color: Colors.red),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadWishlist,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _wishlist.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.favorite_border,
                            size: 80,
                            color: Colors.grey[400],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Your wishlist is empty',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey[600],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Add stocks from the screener to track them',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[500],
                            ),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadWishlist,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _wishlist.length,
                        itemBuilder: (context, index) {
                          final stock = _wishlist[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            elevation: 1.5,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(18),
                              side: BorderSide(color: Colors.grey.withOpacity(0.08)),
                            ),
                            child: InkWell(
                              onTap: () => _showStockDetails(stock),
                              borderRadius: BorderRadius.circular(18),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        gradient: const LinearGradient(
                                          colors: [Color(0xFF5B8DEF), Color(0xFF6E7BEF)],
                                        ),
                                        borderRadius: BorderRadius.circular(14),
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFF5B8DEF).withOpacity(0.3),
                                            blurRadius: 10,
                                            offset: const Offset(0, 6),
                                          ),
                                        ],
                                      ),
                                      child: const Icon(
                                        Icons.show_chart,
                                        color: Colors.white,
                                        size: 22,
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Text(
                                                stock['symbol'] ?? '',
                                                style: const TextStyle(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.bold,
                                                  color: Color(0xFF0F172A),
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              if ((stock['sector'] ?? '').toString().isNotEmpty)
                                                _buildMetaChip(stock['sector'].toString()),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            stock['company_name'] ?? 'Unknown',
                                            style: TextStyle(
                                              fontSize: 14,
                                              color: Colors.grey[600],
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          const SizedBox(height: 8),
                                          // Current price and daily change
                                          _buildPriceChangeWidget(stock),
                                        ],
                                      ),
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.analytics_outlined, color: Color(0xFF5B8DEF)),
                                          onPressed: () => _showStockAnalysis(stock),
                                          tooltip: 'Analyze',
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.delete, color: Colors.red),
                                          onPressed: () => _removeFromWishlist(stock['symbol']),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}
