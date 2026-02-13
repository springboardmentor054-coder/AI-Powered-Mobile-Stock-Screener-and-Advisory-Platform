import 'dart:async';

import 'package:flutter/material.dart';

import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/premium_theme.dart';
import '../widgets/premium_card.dart';

class PortfolioScreenPremium extends StatefulWidget {
  final int userId;
  final String userName;
  final String avatarLabel;

  const PortfolioScreenPremium({
    super.key,
    required this.userId,
    required this.userName,
    required this.avatarLabel,
  });

  @override
  State<PortfolioScreenPremium> createState() => _PortfolioScreenPremiumState();
}

class _PortfolioScreenPremiumState extends State<PortfolioScreenPremium> {
  final ApiService _apiService = ApiService();

  bool _isLoading = true;
  String? _error;
  List<Map<String, dynamic>> _holdings = [];
  Map<String, dynamic> _summary = const {};
  Timer? _refreshTimer;
  DateTime? _lastUpdatedAt;

  @override
  void initState() {
    super.initState();
    _loadPortfolio();
    _refreshTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _loadPortfolio(silent: true),
    );
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadPortfolio({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final payload = await _apiService.getPortfolio(widget.userId);
      final data = payload?['data'] as Map<String, dynamic>? ?? {};
      final holdingsRaw = data['holdings'] as List<dynamic>? ?? const [];
      final summaryRaw = data['summary'] as Map<String, dynamic>? ?? const {};

      if (!mounted) return;
      setState(() {
        _holdings = holdingsRaw.whereType<Map<String, dynamic>>().toList();
        _summary = summaryRaw;
        _isLoading = false;
        _lastUpdatedAt = DateTime.now();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _addPositionDialog() async {
    final symbolController = TextEditingController();
    final quantityController = TextEditingController();
    final avgPriceController = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Position'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: symbolController,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(labelText: 'Symbol'),
            ),
            const SizedBox(height: PremiumUI.spacingM),
            TextField(
              controller: quantityController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: const InputDecoration(labelText: 'Quantity'),
            ),
            const SizedBox(height: PremiumUI.spacingM),
            TextField(
              controller: avgPriceController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: const InputDecoration(labelText: 'Average Price'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final symbol = symbolController.text.trim().toUpperCase();
    final quantity = _toDouble(quantityController.text);
    final avgPrice = _toDouble(avgPriceController.text);

    if (symbol.isEmpty || quantity <= 0 || avgPrice <= 0) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Enter valid symbol, quantity and price.'),
        ),
      );
      return;
    }

    final result = await _apiService.addToPortfolio(
      userId: widget.userId,
      symbol: symbol,
      quantity: quantity,
      avgPrice: avgPrice,
    );

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          result != null
              ? 'Position added successfully.'
              : 'Could not add position.',
        ),
        backgroundColor: result != null
            ? PremiumColors.profit
            : PremiumColors.loss,
      ),
    );

    if (result != null) {
      _loadPortfolio();
    }
  }

  Future<void> _removePosition(String symbol) async {
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Position'),
        content: Text('Remove $symbol from portfolio?'),
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

    if (shouldDelete != true) return;

    final removed = await _apiService.removeFromPortfolio(
      userId: widget.userId,
      symbol: symbol,
    );

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          removed
              ? '$symbol removed from portfolio.'
              : 'Could not remove position.',
        ),
        backgroundColor: removed ? PremiumColors.profit : PremiumColors.loss,
      ),
    );

    if (removed) {
      _loadPortfolio();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6FAFF),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadPortfolio,
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
              ? ListView(
                  children: [
                    const SizedBox(height: 120),
                    EmptyState(
                      icon: Icons.error_outline_rounded,
                      title: 'Portfolio Unavailable',
                      subtitle: _error!,
                    ),
                  ],
                )
              : ListView(
                  padding: const EdgeInsets.all(PremiumUI.spacingL),
                  children: [
                    _buildAccountHero(),
                    const SizedBox(height: PremiumUI.spacingM),
                    _buildSummarySection(),
                    const SizedBox(height: PremiumUI.spacingXL),
                    Row(
                      children: [
                        Text('Holdings', style: PremiumTypography.h3),
                        const SizedBox(width: 8),
                        Text(
                          '${_holdings.length} positions',
                          style: PremiumTypography.caption.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const Spacer(),
                        TextButton.icon(
                          onPressed: _addPositionDialog,
                          icon: const Icon(Icons.add_rounded, size: 18),
                          label: const Text('Add'),
                        ),
                      ],
                    ),
                    const SizedBox(height: PremiumUI.spacingM),
                    if (_holdings.isEmpty)
                      EmptyState(
                        icon: Icons.pie_chart_outline_rounded,
                        title: 'No Positions Yet',
                        subtitle:
                            'Add your first stock to start tracking portfolio performance.',
                        action: ElevatedButton.icon(
                          onPressed: _addPositionDialog,
                          icon: const Icon(Icons.add_rounded),
                          label: const Text('Add Position'),
                        ),
                      )
                    else
                      ..._holdings.map(_buildHoldingCard),
                  ],
                ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addPositionDialog,
        backgroundColor: PremiumColors.neonTeal,
        foregroundColor: PremiumColors.textOnAccent,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add Position'),
      ),
    );
  }

  Widget _buildAccountHero() {
    return AnimatedBuilder(
      animation: AuthService.instance,
      builder: (context, _) {
        final user = AuthService.instance.currentUser;

        return PremiumCard(
          borderRadius: BorderRadius.circular(20),
          padding: const EdgeInsets.all(PremiumUI.spacingM),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF1E3A8A), Color(0xFF2563EB)],
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Text(
                      user?.avatarLabel ?? widget.avatarLabel,
                      style: PremiumTypography.body1.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: PremiumUI.spacingM),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.name ?? widget.userName,
                          style: PremiumTypography.body1.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user?.email ?? 'Not Available',
                          style: PremiumTypography.caption.copyWith(
                            color: Colors.white.withValues(alpha: 0.88),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: _loadPortfolio,
                    icon: const Icon(
                      Icons.refresh_rounded,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.sync_rounded,
                      color: Colors.white,
                      size: 16,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _lastUpdatedAt == null
                          ? 'Syncing portfolio...'
                          : 'Updated ${_formatTimeAgo(_lastUpdatedAt!)}',
                      style: PremiumTypography.caption.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSummarySection() {
    final investment = _toDouble(_summary['total_investment']);
    final currentValue = _toDouble(_summary['current_value']);
    final pnl = _toDouble(_summary['total_gain_loss']);
    final pnlPercent = _toDouble(_summary['total_gain_loss_percent']);
    final positive = pnl >= 0;

    return Column(
      children: [
        PremiumCard(
          borderRadius: BorderRadius.circular(18),
          padding: const EdgeInsets.all(PremiumUI.spacingM),
          gradient: positive
              ? const LinearGradient(
                  colors: [Color(0xFFECFDF5), Color(0xFFD1FAE5)],
                )
              : const LinearGradient(
                  colors: [Color(0xFFFFF1F2), Color(0xFFFFE4E6)],
                ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: (positive ? PremiumColors.profit : PremiumColors.loss)
                      .withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  positive
                      ? Icons.trending_up_rounded
                      : Icons.trending_down_rounded,
                  color: positive ? PremiumColors.profit : PremiumColors.loss,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Total Profit and Loss',
                      style: PremiumTypography.caption.copyWith(
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF334155),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${positive ? '+' : ''}${_currency(pnl)} (${positive ? '+' : ''}${pnlPercent.toStringAsFixed(2)}%)',
                      style: PremiumTypography.body1.copyWith(
                        fontWeight: FontWeight.w700,
                        color: positive
                            ? PremiumColors.profit
                            : PremiumColors.loss,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: PremiumUI.spacingM),
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                label: 'Investment',
                value: _currency(investment),
                icon: Icons.account_balance_wallet_outlined,
              ),
            ),
            const SizedBox(width: PremiumUI.spacingM),
            Expanded(
              child: _buildMetricCard(
                label: 'Current Value',
                value: _currency(currentValue),
                icon: Icons.show_chart_rounded,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricCard({
    required String label,
    required String value,
    required IconData icon,
  }) {
    return PremiumCard(
      borderRadius: BorderRadius.circular(16),
      padding: const EdgeInsets.all(PremiumUI.spacingM),
      backgroundColor: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: PremiumColors.neonTeal, size: 20),
          const SizedBox(height: 8),
          Text(
            label,
            style: PremiumTypography.caption.copyWith(
              fontWeight: FontWeight.w700,
              color: const Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: PremiumTypography.body2.copyWith(
              fontWeight: FontWeight.w700,
              color: const Color(0xFF0F172A),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHoldingCard(Map<String, dynamic> holding) {
    final symbol = (holding['symbol']?.toString().trim().isNotEmpty == true)
        ? holding['symbol'].toString()
        : 'NA';
    final name = _companyName(holding);
    final quantity = _toDouble(holding['quantity']);
    final avgPrice = _toDouble(holding['avg_price']);
    final currentPrice = _toDouble(holding['current_price']);
    final pnl = _toDouble(holding['gain_loss']);
    final pnlPercent = _toDouble(holding['gain_loss_percent']);
    final isPositive = pnl >= 0;

    return Padding(
      padding: const EdgeInsets.only(bottom: PremiumUI.spacingM),
      child: PremiumCard(
        borderRadius: BorderRadius.circular(16),
        padding: const EdgeInsets.all(PremiumUI.spacingM),
        backgroundColor: Colors.white,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        symbol,
                        style: PremiumTypography.body1.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: PremiumTypography.caption.copyWith(
                          color: const Color(0xFF64748B),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => _removePosition(symbol),
                  icon: const Icon(
                    Icons.delete_outline_rounded,
                    color: PremiumColors.loss,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildInfoChip('Qty', quantity.toStringAsFixed(2)),
                _buildInfoChip('Avg', _currency(avgPrice)),
                _buildInfoChip('Current', _currency(currentPrice)),
              ],
            ),
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: (isPositive ? PremiumColors.profit : PremiumColors.loss)
                    .withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '${isPositive ? '+' : ''}${_currency(pnl)} (${isPositive ? '+' : ''}${pnlPercent.toStringAsFixed(2)}%)',
                style: PremiumTypography.body2.copyWith(
                  color: isPositive ? PremiumColors.profit : PremiumColors.loss,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoChip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(9),
      ),
      child: Text(
        '$label: $value',
        style: PremiumTypography.caption.copyWith(
          color: const Color(0xFF334155),
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  String _companyName(Map<String, dynamic> value) {
    final name =
        value['name']?.toString().trim() ??
        value['companyName']?.toString().trim() ??
        value['company_name']?.toString().trim() ??
        '';
    return name.isEmpty ? 'Not Available' : name;
  }

  double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  String _currency(double amount) => 'Rs ${amount.toStringAsFixed(2)}';

  String _formatTimeAgo(DateTime value) {
    final diff = DateTime.now().difference(value);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s ago';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    return '${diff.inHours}h ago';
  }
}
