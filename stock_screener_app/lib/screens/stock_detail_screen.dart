import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../models/stock_model.dart';
import '../utils/colors.dart';
import '../services/watchlist_service.dart';

class StockDetailScreen extends StatefulWidget {
  final Stock stock;

  const StockDetailScreen({super.key, required this.stock});

  @override
  State<StockDetailScreen> createState() => _StockDetailScreenState();
}

class _StockDetailScreenState extends State<StockDetailScreen> {
  bool _isInWatchlist = false;
  List<Map<String, dynamic>> _chartData = [];
  bool _isLoadingChart = true;
  String _selectedPeriod = '1D';

  @override
  void initState() {
    super.initState();
    _checkWatchlistStatus();
    _loadChartData();
  }

  Future<void> _checkWatchlistStatus() async {
    final isWatched = await WatchlistService.isInWatchlist(widget.stock.symbol);
    setState(() => _isInWatchlist = isWatched);
  }

  Future<void> _loadChartData() async {
    setState(() => _isLoadingChart = true);
    // TODO: Implement intraday chart data endpoint in backend
    // For now, generate mock data based on current price
    final mockData = _generateMockChartData();
    setState(() {
      _chartData = mockData;
      _isLoadingChart = false;
    });
  }

  List<Map<String, dynamic>> _generateMockChartData() {
    final currentPrice = widget.stock.currentPrice ?? 100.0;
    final volatility = currentPrice * 0.02; // 2% volatility
    final random = DateTime.now().millisecondsSinceEpoch % 100;
    
    return List.generate(20, (i) {
      final basePrice = currentPrice + (volatility * (random % 10 - 5) / 10);
      return {
        'time': DateTime.now().subtract(Duration(minutes: 20 - i)).toIso8601String(),
        'price': basePrice + (volatility * (i % 5 - 2) / 5),
      };
    });
  }

  Future<void> _toggleWatchlist() async {
    final newStatus = await WatchlistService.toggleWatchlist(widget.stock.symbol);
    setState(() => _isInWatchlist = newStatus);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          newStatus
              ? '${widget.stock.symbol} added to watchlist'
              : '${widget.stock.symbol} removed from watchlist',
        ),
        backgroundColor: newStatus ? AppColors.success : AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isPositive = widget.stock.isGainer;
    
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              isPositive
                  ? AppColors.success.withOpacity(0.1)
                  : AppColors.error.withOpacity(0.1),
              Colors.white,
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(),
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      _buildPriceCard(),
                      _buildChart(),
                      _buildMetrics(),
                      _buildAbout(),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.pop(context),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              widget.stock.symbol.substring(0, 1),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.stock.symbol,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  widget.stock.name,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          IconButton(
            icon: FaIcon(
              _isInWatchlist ? FontAwesomeIcons.solidStar : FontAwesomeIcons.star,
              color: _isInWatchlist ? AppColors.accentOrange : AppColors.textSecondary,
            ),
            onPressed: _toggleWatchlist,
          ),
        ],
      ),
    );
  }

  Widget _buildPriceCard() {
    final isPositive = widget.stock.isGainer;
    
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            isPositive ? AppColors.success.withOpacity(0.1) : AppColors.error.withOpacity(0.1),
            Colors.white,
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isPositive ? AppColors.success.withOpacity(0.3) : AppColors.error.withOpacity(0.3),
        ),
        boxShadow: [
          BoxShadow(
            color: (isPositive ? AppColors.success : AppColors.error).withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Current Price',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                '₹${widget.stock.currentPrice?.toStringAsFixed(2) ?? 'N/A'}',
                style: const TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isPositive
                      ? AppColors.success.withOpacity(0.2)
                      : AppColors.error.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    FaIcon(
                      isPositive ? FontAwesomeIcons.arrowUp : FontAwesomeIcons.arrowDown,
                      size: 14,
                      color: isPositive ? AppColors.success : AppColors.error,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${widget.stock.changePercent?.toStringAsFixed(2)}%',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isPositive ? AppColors.success : AppColors.error,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${isPositive ? '+' : ''}₹${widget.stock.changeAmount?.toStringAsFixed(2) ?? 'N/A'}',
            style: TextStyle(
              fontSize: 16,
              color: isPositive ? AppColors.success : AppColors.error,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChart() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Price Chart',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Flexible(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: ['1D', '1W', '1M', '3M', '1Y'].map((period) {
                      final isSelected = _selectedPeriod == period;
                      return GestureDetector(
                        onTap: () => setState(() => _selectedPeriod = period),
                        child: Container(
                          margin: const EdgeInsets.only(left: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.primary : AppColors.surfaceVariant,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            period,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? Colors.white : AppColors.textSecondary,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 200,
            child: _isLoadingChart
                ? const Center(child: CircularProgressIndicator())
                : _buildLineChart(),
          ),
        ],
      ),
    );
  }

  Widget _buildLineChart() {
    if (_chartData.isEmpty) {
      return const Center(child: Text('No chart data available'));
    }

    // Helper to safely convert value to double
    double safeToDouble(dynamic value) {
      if (value == null) return 0.0;
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0.0;
      return 0.0;
    }

    final spots = <FlSpot>[];
    for (int i = 0; i < _chartData.length; i++) {
      spots.add(FlSpot(i.toDouble(), safeToDouble(_chartData[i]['price'])));
    }

    final isPositive = widget.stock.isGainer;

    return LineChart(
      LineChartData(
        gridData: FlGridData(show: false),
        titlesData: FlTitlesData(show: false),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: isPositive ? AppColors.success : AppColors.error,
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  (isPositive ? AppColors.success : AppColors.error).withOpacity(0.3),
                  (isPositive ? AppColors.success : AppColors.error).withOpacity(0.0),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetrics() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Key Metrics',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 20),
          _buildMetricRow('P/E Ratio', widget.stock.peRatio?.toStringAsFixed(2) ?? 'N/A', FontAwesomeIcons.chartLine),
          _buildMetricRow('PEG Ratio', widget.stock.pegRatio?.toStringAsFixed(2) ?? 'N/A', FontAwesomeIcons.chartColumn),
          _buildMetricRow('Market Cap', _formatMarketCap(widget.stock.marketCap), FontAwesomeIcons.buildingColumns),
          _buildMetricRow('Debt/FCF', widget.stock.debtToFcf?.toStringAsFixed(2) ?? 'N/A', FontAwesomeIcons.scaleBalanced),
          _buildMetricRow('Revenue Growth', widget.stock.revenueGrowth != null ? '${widget.stock.revenueGrowth!.toStringAsFixed(1)}%' : 'N/A', FontAwesomeIcons.arrowTrendUp),
          _buildMetricRow('Volume', widget.stock.volume != null ? _formatVolume(widget.stock.volume!) : 'N/A', FontAwesomeIcons.chartBar),
        ],
      ),
    );
  }

  Widget _buildMetricRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: FaIcon(icon, size: 16, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAbout() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient.scale(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              FaIcon(FontAwesomeIcons.circleInfo, color: AppColors.primary),
              const SizedBox(width: 8),
              const Text(
                'About',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildInfoRow('Sector', widget.stock.sector),
          _buildInfoRow('Exchange', widget.stock.exchange ?? 'NSE'),
          _buildInfoRow('Symbol', widget.stock.symbol),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  String _formatMarketCap(double? marketCap) {
    if (marketCap == null) return 'N/A';

    if (marketCap >= 1e12) {
      return '₹${(marketCap / 1e12).toStringAsFixed(2)}T';
    } else if (marketCap >= 1e9) {
      return '₹${(marketCap / 1e9).toStringAsFixed(2)}B';
    } else if (marketCap >= 1e6) {
      return '₹${(marketCap / 1e6).toStringAsFixed(2)}M';
    } else {
      return '₹${marketCap.toStringAsFixed(0)}';
    }
  }

  String _formatVolume(double volume) {
    if (volume >= 1e6) {
      return '${(volume / 1e6).toStringAsFixed(2)}M';
    } else if (volume >= 1e3) {
      return '${(volume / 1e3).toStringAsFixed(2)}K';
    } else {
      return volume.toStringAsFixed(0);
    }
  }
}
