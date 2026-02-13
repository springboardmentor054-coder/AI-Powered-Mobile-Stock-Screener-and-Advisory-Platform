import 'package:flutter/material.dart';
import '../services/insights_api_service.dart';
import '../models/stock_insights.dart';
import '../models/risk_analysis.dart';

class StockInsightsScreen extends StatefulWidget {
  final String symbol;

  const StockInsightsScreen({super.key, required this.symbol});

  @override
  _StockInsightsScreenState createState() => _StockInsightsScreenState();
}

class _StockInsightsScreenState extends State<StockInsightsScreen>
    with SingleTickerProviderStateMixin {
  final InsightsApiService _apiService = InsightsApiService();
  late TabController _tabController;

  StockInsights? _insights;
  RiskAnalysis? _riskAnalysis;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final insights = await _apiService.getStockInsights(widget.symbol);
      final riskAnalysis = await _apiService.getRiskAnalysis(widget.symbol);

      setState(() {
        _insights = insights;
        _riskAnalysis = riskAnalysis;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.symbol} - Insights'),
        backgroundColor: Colors.indigo,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.info), text: 'Overview'),
            Tab(icon: Icon(Icons.warning), text: 'Risk Analysis'),
            Tab(icon: Icon(Icons.show_chart), text: 'Quarterly'),
          ],
        ),
      ),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton(
        onPressed: _loadData,
        backgroundColor: Colors.indigo,
        child: const Icon(Icons.refresh),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(_error!, style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadData,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    return TabBarView(
      controller: _tabController,
      children: [
        _buildOverviewTab(),
        _buildRiskAnalysisTab(),
        _buildQuarterlyTab(),
      ],
    );
  }

  Widget _buildOverviewTab() {
    if (_insights == null) return const Center(child: Text('No data available'));

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildFundamentalsCard(),
          const SizedBox(height: 16),
          _buildValuationCard(),
          const SizedBox(height: 16),
          _buildGrowthCard(),
          const SizedBox(height: 16),
          _buildKeyHighlightsCard(),
          const SizedBox(height: 16),
          _buildRiskFactorsCard(),
          const SizedBox(height: 16),
          _buildDisclaimerCard(),
        ],
      ),
    );
  }

  Widget _buildFundamentalsCard() {
    final fundamentals = _insights!.fundamentals;

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.business, color: Colors.indigo, size: 28),
                const SizedBox(width: 8),
                Text(
                  'Fundamentals',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const Divider(height: 24),
            if (fundamentals.companyName != null)
              _buildInfoRow('Company', fundamentals.companyName!),
            if (fundamentals.sector != null)
              _buildInfoRow('Sector', fundamentals.sector!),
            _buildInfoRow('Market Cap', '₹${_formatNumber(fundamentals.marketCap)} Cr'),
            _buildInfoRow('Category', fundamentals.category),
            _buildInfoRow('PE Ratio', fundamentals.peRatio.toStringAsFixed(2)),
            _buildInfoRow('PB Ratio', fundamentals.pbRatio.toStringAsFixed(2)),
            _buildInfoRow('Debt/Equity', fundamentals.debtToEquity.toStringAsFixed(2)),
          ],
        ),
      ),
    );
  }

  Widget _buildValuationCard() {
    final valuation = _insights!.valuationInsights;

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.attach_money, color: Colors.green, size: 28),
                const SizedBox(width: 8),
                Text(
                  'Valuation',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const Divider(height: 24),
            _buildInfoRow('Relative PE', valuation.relativePE),
            const SizedBox(height: 8),
            Text(
              valuation.interpretation,
              style: const TextStyle(fontSize: 14, color: Colors.black87),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGrowthCard() {
    final growth = _insights!.growthInsights;

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.trending_up, color: Colors.blue, size: 28),
                const SizedBox(width: 8),
                Text(
                  'Growth Insights',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const Divider(height: 24),
            if (growth.revenueGrowthYoY != null)
              _buildInfoRow('Revenue Growth YoY', '${growth.revenueGrowthYoY!.toStringAsFixed(2)}%'),
            if (growth.earningsGrowthYoY != null)
              _buildInfoRow('Earnings Growth YoY', '${growth.earningsGrowthYoY!.toStringAsFixed(2)}%'),
            _buildInfoRow('Trend', growth.trend),
          ],
        ),
      ),
    );
  }

  Widget _buildKeyHighlightsCard() {
    return Card(
      elevation: 4,
      color: Colors.blue[50],
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.star, color: Colors.amber, size: 28),
                const SizedBox(width: 8),
                Text(
                  'Key Highlights',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const Divider(height: 24),
            ..._insights!.keyHighlights.map((highlight) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('', style: TextStyle(color: Colors.green, fontSize: 18)),
                      Expanded(
                        child: Text(highlight, style: const TextStyle(fontSize: 14)),
                      ),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildRiskFactorsCard() {
    return Card(
      elevation: 4,
      color: Colors.red[50],
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.warning_amber, color: Colors.red, size: 28),
                const SizedBox(width: 8),
                Text(
                  'Risk Factors',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const Divider(height: 24),
            ..._insights!.riskFactors.map((risk) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.warning_amber, color: Colors.orange, size: 18),
                      Expanded(
                        child: Text(risk, style: const TextStyle(fontSize: 14)),
                      ),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildDisclaimerCard() {
    return Card(
      elevation: 2,
      color: Colors.grey[200],
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.info_outline, size: 20, color: Colors.grey),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                _insights!.disclaimer,
                style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: Colors.grey),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRiskAnalysisTab() {
    if (_riskAnalysis == null) return const Center(child: Text('No risk data available'));

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildOverallRiskCard(),
          const SizedBox(height: 16),
          _buildRiskBreakdownCard(),
          const SizedBox(height: 16),
          _buildMitigationCard(),
          const SizedBox(height: 16),
          _buildInvestorSuitabilityCard(),
        ],
      ),
    );
  }

  Widget _buildOverallRiskCard() {
    final risk = _riskAnalysis!;
    final color = _getRiskColor(risk.overallRisk);

    return Card(
      elevation: 6,
      color: color.withOpacity(0.1),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Overall Risk',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            Text(
              risk.overallRisk,
              style: TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Risk Score: ${risk.riskScore}/100',
              style: const TextStyle(fontSize: 18),
            ),
            const SizedBox(height: 16),
            LinearProgressIndicator(
              value: risk.riskScore / 100,
              backgroundColor: Colors.grey[300],
              color: color,
              minHeight: 8,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRiskBreakdownCard() {
    final breakdown = _riskAnalysis!.breakdown;

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Risk Breakdown',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const Divider(height: 24),
            _buildRiskFactorRow('Debt Risk', breakdown.debtRisk),
            _buildRiskFactorRow('Earnings Risk', breakdown.earningsRisk),
            _buildRiskFactorRow('Valuation Risk', breakdown.valuationRisk),
            _buildRiskFactorRow('Growth Risk', breakdown.growthRisk),
            _buildRiskFactorRow('Sector Risk', breakdown.sectorRisk),
          ],
        ),
      ),
    );
  }

  Widget _buildRiskFactorRow(String label, RiskFactor factor) {
    final color = _getRiskColor(factor.level);

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
              Chip(
                label: Text(factor.level, style: const TextStyle(color: Colors.white, fontSize: 12)),
                backgroundColor: color,
                padding: EdgeInsets.zero,
              ),
            ],
          ),
          const SizedBox(height: 4),
          LinearProgressIndicator(
            value: factor.score / 100,
            backgroundColor: Colors.grey[200],
            color: color,
            minHeight: 6,
          ),
          if (factor.details != null) ...[
            const SizedBox(height: 4),
            Text(factor.details!, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ],
      ),
    );
  }

  Widget _buildMitigationCard() {
    return Card(
      elevation: 4,
      color: Colors.green[50],
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.shield, color: Colors.green, size: 28),
                const SizedBox(width: 8),
                Text(
                  'Risk Mitigation',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Divider(height: 24),
            ..._riskAnalysis!.mitigationInsights.map((insight) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('• ', style: TextStyle(fontSize: 18, color: Colors.green)),
                      Expanded(
                        child: Text(insight, style: const TextStyle(fontSize: 14)),
                      ),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildInvestorSuitabilityCard() {
    return Card(
      elevation: 4,
      color: Colors.purple[50],
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.person, color: Colors.purple, size: 28),
                const SizedBox(width: 8),
                Text(
                  'Investor Suitability',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Divider(height: 24),
            Text(
              _riskAnalysis!.investorSuitability,
              style: const TextStyle(fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuarterlyTab() {
    if (_insights == null || _insights!.quarterlyPerformance.isEmpty) {
      return const Center(child: Text('No quarterly data available'));
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            elevation: 4,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Quarterly Performance',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const Divider(height: 24),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(
                      columns: const [
                        DataColumn(label: Text('Quarter')),
                        DataColumn(label: Text('Revenue (Cr)')),
                        DataColumn(label: Text('Profit (Cr)')),
                        DataColumn(label: Text('Margin (%)')),
                      ],
                      rows: _insights!.quarterlyPerformance
                          .map((q) => DataRow(cells: [
                                DataCell(Text(q.quarter.substring(0, 10))),
                                DataCell(Text(_formatNumber(q.revenue))),
                                DataCell(Text(_formatNumber(q.profit))),
                                DataCell(Text(q.margin.toStringAsFixed(2))),
                              ]))
                          .toList(),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
          Text(value, style: const TextStyle(fontSize: 14)),
        ],
      ),
    );
  }

  Color _getRiskColor(String level) {
    switch (level) {
      case 'LOW':
        return Colors.green;
      case 'MEDIUM':
        return Colors.orange;
      case 'HIGH':
        return Colors.red;
      case 'VERY HIGH':
        return Colors.red[900]!;
      default:
        return Colors.grey;
    }
  }

  String _formatNumber(double number) {
    if (number >= 10000) {
      return (number / 10000).toStringAsFixed(2);
    }
    return number.toStringAsFixed(2);
  }
}
