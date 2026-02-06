import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:fl_chart/fl_chart.dart';

class RealtimeStockCard extends StatefulWidget {
  final dynamic stock;
  final VoidCallback onTap;

  const RealtimeStockCard({
    Key? key,
    required this.stock,
    required this.onTap,
  }) : super(key: key);

  @override
  State<RealtimeStockCard> createState() => _RealtimeStockCardState();
}

class _RealtimeStockCardState extends State<RealtimeStockCard> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _realtimeData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadRealtimeData();
  }

  Future<void> _loadRealtimeData() async {
    final symbol = widget.stock['symbol'];
    final data = await _apiService.getRealtimeStockData(symbol);
    if (mounted) {
      setState(() {
        _realtimeData = data;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final symbol = widget.stock['symbol'] ?? 'N/A';
    final name = widget.stock['name'] ?? 'Unknown';
    final sector = widget.stock['sector'] ?? 'N/A';
    
    final currentPrice = _realtimeData?['currentPrice'] ?? 0.0;
    final change = _realtimeData?['change'] ?? 0.0;
    final changePercent = _realtimeData?['changePercent'] ?? 0.0;
    final isPositive = change >= 0;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: widget.onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          symbol,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          name,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          sector,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (_isLoading)
                    const CircularProgressIndicator()
                  else
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '₹${currentPrice.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: isPositive ? Colors.green : Colors.red,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '${isPositive ? '+' : ''}${changePercent.toStringAsFixed(2)}%',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
              
              // Chart
              if (!_isLoading && _realtimeData != null) ...[
                const SizedBox(height: 16),
                SizedBox(
                  height: 80,
                  child: _buildMiniChart(),
                ),
              ],
              
              // Metrics
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildMetric('P/E', widget.stock['pe_ratio']),
                  _buildMetric('PEG', widget.stock['peg_ratio']),
                  _buildMetric('Market Cap', _formatMarketCap(widget.stock['market_cap'])),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMiniChart() {
    final prices = (_realtimeData?['prices'] as List<dynamic>?)
        ?.map((p) => p is num ? p.toDouble() : 0.0)
        .toList() ?? [];
    
    if (prices.isEmpty) {
      return const Center(child: Text('No chart data'));
    }

    final minPrice = prices.reduce((a, b) => a < b ? a : b);
    final maxPrice = prices.reduce((a, b) => a > b ? a : b);
    final isPositive = (_realtimeData?['change'] ?? 0) >= 0;

    return LineChart(
      LineChartData(
        gridData: const FlGridData(show: false),
        titlesData: const FlTitlesData(show: false),
        borderData: FlBorderData(show: false),
        minX: 0,
        maxX: (prices.length - 1).toDouble(),
        minY: minPrice * 0.999,
        maxY: maxPrice * 1.001,
        lineBarsData: [
          LineChartBarData(
            spots: prices.asMap().entries.map((e) {
              return FlSpot(e.key.toDouble(), e.value);
            }).toList(),
            isCurved: true,
            color: isPositive ? Colors.green : Colors.red,
            barWidth: 2,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              color: (isPositive ? Colors.green : Colors.red).withOpacity(0.1),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetric(String label, dynamic value) {
    String displayValue = 'N/A';
    if (value != null) {
      if (value is num) {
        displayValue = value.toStringAsFixed(2);
      } else {
        displayValue = value.toString();
      }
    }

    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          displayValue,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  String _formatMarketCap(dynamic value) {
    if (value == null) return 'N/A';
    final num cap = value is num ? value : double.tryParse(value.toString()) ?? 0;
    if (cap >= 1e12) return '${(cap / 1e12).toStringAsFixed(2)}T';
    if (cap >= 1e9) return '${(cap / 1e9).toStringAsFixed(2)}B';
    if (cap >= 1e6) return '${(cap / 1e6).toStringAsFixed(2)}M';
    return cap.toStringAsFixed(0);
  }
}
