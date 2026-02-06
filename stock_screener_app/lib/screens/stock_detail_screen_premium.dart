import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../theme/premium_theme.dart';
import '../widgets/premium_card.dart';

class StockDetailScreen extends StatefulWidget {
  final String symbol;
  final dynamic stockData;

  const StockDetailScreen({
    super.key,
    required this.symbol,
    required this.stockData,
  });

  @override
  State<StockDetailScreen> createState() => _StockDetailScreenState();
}

class _StockDetailScreenState extends State<StockDetailScreen> {
  String _selectedTimeframe = '1D';
  
  @override
  Widget build(BuildContext context) {
    final currentPrice = widget.stockData['currentPrice']?.toDouble() ?? 0.0;
    final previousClose = widget.stockData['previousClose']?.toDouble() ?? currentPrice;
    final change = currentPrice - previousClose;
    final changePercent = previousClose != 0 ? ((change / previousClose) * 100) : 0.0;
    final isPositive = change >= 0;
    final changeColor = isPositive ? PremiumColors.profit : PremiumColors.loss;

    return Scaffold(
      backgroundColor: PremiumColors.deepDark,
      body: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            expandedHeight: 120,
            floating: false,
            pinned: true,
            backgroundColor: PremiumColors.deepDark,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsets.only(left: 56, bottom: 16),
              title: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    widget.symbol,
                    style: PremiumTypography.h2.copyWith(fontSize: 20),
                  ),
                  Text(
                    widget.stockData['companyName']?.toString() ?? '',
                    style: PremiumTypography.caption.copyWith(fontSize: 10),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.bookmark_border_rounded),
                onPressed: () {
                  // TODO: Add to watchlist
                },
              ),
              IconButton(
                icon: const Icon(Icons.share_rounded),
                onPressed: () {
                  // TODO: Share functionality
                },
              ),
            ],
          ),

          // Price Section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(PremiumUI.spacingL),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '₹${currentPrice.toStringAsFixed(2)}',
                        style: PremiumTypography.priceLarge,
                      ),
                      const SizedBox(width: PremiumUI.spacingM),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: PremiumUI.spacingM,
                          vertical: PremiumUI.spacingS,
                        ),
                        decoration: BoxDecoration(
                          color: changeColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(PremiumUI.radiusM),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              isPositive ? Icons.arrow_upward : Icons.arrow_downward,
                              size: 16,
                              color: changeColor,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${change.toStringAsFixed(2)} (${changePercent.toStringAsFixed(2)}%)',
                              style: PremiumTypography.body2.copyWith(
                                color: changeColor,
                                fontWeight: FontWeight.w600,
                                fontFamily: PremiumTypography.numericFont,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: PremiumUI.spacingS),
                  Text(
                    'Previous Close: ₹${previousClose.toStringAsFixed(2)}',
                    style: PremiumTypography.caption,
                  ),
                ],
              ),
            ),
          ),

          // Chart Timeframe Selector
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: PremiumUI.spacingL),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ['1D', '1W', '1M', '3M', '1Y', '5Y'].map((timeframe) {
                    final isSelected = _selectedTimeframe == timeframe;
                    return Padding(
                      padding: const EdgeInsets.only(right: PremiumUI.spacingS),
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedTimeframe = timeframe),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: PremiumUI.spacingM,
                            vertical: PremiumUI.spacingS,
                          ),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? PremiumColors.neonTeal
                                : PremiumColors.surfaceBg,
                            borderRadius: BorderRadius.circular(PremiumUI.radiusM),
                          ),
                          child: Text(
                            timeframe,
                            style: PremiumTypography.body2.copyWith(
                              color: isSelected
                                  ? PremiumColors.deepDark
                                  : PremiumColors.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
          ),

          // Chart
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(PremiumUI.spacingL),
              child: PremiumCard(
                padding: const EdgeInsets.all(PremiumUI.spacingM),
                child: SizedBox(
                  height: 300,
                  child: _buildChart(currentPrice, changePercent),
                ),
              ),
            ),
          ),

          // Key Metrics
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: PremiumUI.spacingL),
              child: Text(
                'Key Metrics',
                style: PremiumTypography.h3,
              ),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.all(PremiumUI.spacingL),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: PremiumUI.spacingM,
                mainAxisSpacing: PremiumUI.spacingM,
                childAspectRatio: 1.5,
              ),
              delegate: SliverChildListDelegate([
                _buildMetricCard(
                  'Market Cap',
                  _formatMarketCap(widget.stockData['marketCap']),
                  Icons.business_rounded,
                ),
                _buildMetricCard(
                  'P/E Ratio',
                  widget.stockData['peRatio']?.toStringAsFixed(2) ?? 'N/A',
                  Icons.analytics_rounded,
                ),
                _buildMetricCard(
                  'ROE',
                  widget.stockData['roe'] != null
                      ? '${widget.stockData['roe'].toStringAsFixed(2)}%'
                      : 'N/A',
                  Icons.trending_up_rounded,
                ),
                _buildMetricCard(
                  'Debt/Equity',
                  widget.stockData['debtToEquity']?.toStringAsFixed(2) ?? 'N/A',
                  Icons.account_balance_wallet_rounded,
                ),
                _buildMetricCard(
                  'Sector',
                  widget.stockData['sector']?.toString() ?? 'Unknown',
                  Icons.category_rounded,
                ),
                _buildMetricCard(
                  'Volume',
                  _formatVolume(widget.stockData['volume']),
                  Icons.bar_chart_rounded,
                ),
              ]),
            ),
          ),

          // Fundamentals Section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: PremiumUI.spacingL),
              child: Text(
                'Fundamentals',
                style: PremiumTypography.h3,
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(PremiumUI.spacingL),
              child: PremiumCard(
                padding: const EdgeInsets.all(PremiumUI.spacingL),
                child: Column(
                  children: [
                    _buildFundamentalRow('Revenue', widget.stockData['revenue']),
                    const Divider(height: 24),
                    _buildFundamentalRow('Net Profit', widget.stockData['netProfit']),
                    const Divider(height: 24),
                    _buildFundamentalRow('EBITDA', widget.stockData['ebitda']),
                    const Divider(height: 24),
                    _buildFundamentalRow('EPS', widget.stockData['eps']),
                  ],
                ),
              ),
            ),
          ),

          // Bottom Padding
          const SliverToBoxAdapter(
            child: SizedBox(height: PremiumUI.spacingXL),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(PremiumUI.spacingL),
          child: Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    // TODO: Add to portfolio
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: PremiumColors.neonTeal,
                    padding: const EdgeInsets.symmetric(vertical: PremiumUI.spacingM),
                  ),
                  child: const Text('Add to Portfolio'),
                ),
              ),
              const SizedBox(width: PremiumUI.spacingM),
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    // TODO: Create alert
                  },
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: PremiumColors.neonTeal, width: 2),
                    padding: const EdgeInsets.symmetric(vertical: PremiumUI.spacingM),
                  ),
                  child: const Text(
                    'Set Alert',
                    style: TextStyle(color: PremiumColors.neonTeal),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChart(double currentPrice, double changePercent) {
    // Generate real-time style data based on current price
    final data = _generateChartData(currentPrice, changePercent);
    final isPositive = changePercent >= 0;
    final chartColor = isPositive ? PremiumColors.profit : PremiumColors.loss;

    // Find min and max for Y-axis
    double minY = data.map((e) => e.price).reduce((a, b) => a < b ? a : b);
    double maxY = data.map((e) => e.price).reduce((a, b) => a > b ? a : b);
    final padding = (maxY - minY) * 0.1;
    minY -= padding;
    maxY += padding;

    return LineChart(
      LineChartData(
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: (maxY - minY) / 4,
          getDrawingHorizontalLine: (value) {
            return FlLine(
              color: Colors.white.withOpacity(0.05),
              strokeWidth: 1,
            );
          },
        ),
        titlesData: FlTitlesData(
          show: true,
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 50,
              getTitlesWidget: (value, meta) {
                return Text(
                  '₹${value.toStringAsFixed(0)}',
                  style: PremiumTypography.caption.copyWith(
                    fontSize: 10,
                    color: PremiumColors.textSecondary,
                  ),
                );
              },
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 30,
              interval: data.length / 4,
              getTitlesWidget: (value, meta) {
                final index = value.toInt();
                if (index < 0 || index >= data.length) return const SizedBox.shrink();
                final time = data[index].time;
                return Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    DateFormat('HH:mm').format(time),
                    style: PremiumTypography.caption.copyWith(
                      fontSize: 10,
                      color: PremiumColors.textSecondary,
                    ),
                  ),
                );
              },
            ),
          ),
        ),
        borderData: FlBorderData(show: false),
        minX: 0,
        maxX: (data.length - 1).toDouble(),
        minY: minY,
        maxY: maxY,
        lineBarsData: [
          LineChartBarData(
            spots: data.asMap().entries.map((e) {
              return FlSpot(e.key.toDouble(), e.value.price);
            }).toList(),
            isCurved: true,
            color: chartColor,
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              gradient: LinearGradient(
                colors: [
                  chartColor.withOpacity(0.3),
                  chartColor.withOpacity(0.0),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
        ],
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            getTooltipColor: (touchedSpot) => PremiumColors.cardBg,
            tooltipRoundedRadius: 8,
            getTooltipItems: (touchedSpots) {
              return touchedSpots.map((spot) {
                final time = data[spot.x.toInt()].time;
                return LineTooltipItem(
                  '₹${spot.y.toStringAsFixed(2)}\n${DateFormat('HH:mm').format(time)}',
                  PremiumTypography.caption.copyWith(
                    color: PremiumColors.textPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                );
              }).toList();
            },
          ),
          handleBuiltInTouches: true,
        ),
      ),
    );
  }

  List<ChartData> _generateChartData(double currentPrice, double changePercent) {
    final now = DateTime.now();
    final data = <ChartData>[];
    final points = 50;
    final startPrice = currentPrice * (1 - changePercent / 100);

    for (int i = 0; i < points; i++) {
      final time = now.subtract(Duration(minutes: points - i));
      final progress = i / (points - 1);
      // Add realistic volatility
      final volatility = (changePercent.abs() * 0.01) * (i % 5 - 2);
      final price = startPrice + (currentPrice - startPrice) * progress + volatility;
      data.add(ChartData(time, price));
    }

    return data;
  }

  Widget _buildMetricCard(String label, String value, IconData icon) {
    return PremiumCard(
      padding: const EdgeInsets.all(PremiumUI.spacingM),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(
            icon,
            color: PremiumColors.neonTeal,
            size: PremiumUI.iconL,
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: PremiumTypography.caption,
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: PremiumTypography.body1.copyWith(
                  fontWeight: FontWeight.w600,
                  fontFamily: value.contains('%') || value.contains('₹')
                      ? PremiumTypography.numericFont
                      : PremiumTypography.primaryFont,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFundamentalRow(String label, dynamic value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: PremiumTypography.body2,
        ),
        Text(
          value != null ? _formatCurrency(value) : 'N/A',
          style: PremiumTypography.body1.copyWith(
            fontWeight: FontWeight.w600,
            fontFamily: PremiumTypography.numericFont,
          ),
        ),
      ],
    );
  }

  String _formatMarketCap(dynamic value) {
    if (value == null) return 'N/A';
    final number = value is double || value is int ? value : double.tryParse(value.toString()) ?? 0;
    if (number >= 10000) {
      return '₹${(number / 10000).toStringAsFixed(2)}T';
    } else if (number >= 100) {
      return '₹${(number / 100).toStringAsFixed(2)}B';
    } else {
      return '₹${number.toStringAsFixed(2)}Cr';
    }
  }

  String _formatVolume(dynamic value) {
    if (value == null) return 'N/A';
    final number = value is double || value is int ? value : double.tryParse(value.toString()) ?? 0;
    if (number >= 10000000) {
      return '${(number / 10000000).toStringAsFixed(2)}Cr';
    } else if (number >= 100000) {
      return '${(number / 100000).toStringAsFixed(2)}L';
    } else {
      return number.toStringAsFixed(0);
    }
  }

  String _formatCurrency(dynamic value) {
    if (value == null) return 'N/A';
    final number = value is double || value is int ? value : double.tryParse(value.toString()) ?? 0;
    if (number >= 10000) {
      return '₹${(number / 10000).toStringAsFixed(2)}T';
    } else if (number >= 100) {
      return '₹${(number / 100).toStringAsFixed(2)}B';
    } else {
      return '₹${number.toStringAsFixed(2)}Cr';
    }
  }
}

class ChartData {
  final DateTime time;
  final double price;

  ChartData(this.time, this.price);
}
