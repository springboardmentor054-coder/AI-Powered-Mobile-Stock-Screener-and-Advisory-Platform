import 'package:flutter/material.dart';
import '../theme/premium_theme.dart';
import '../widgets/premium_card.dart';
import '../services/api_service.dart';

class AlertsScreen extends StatefulWidget {
  final int userId;

  const AlertsScreen({
    super.key,
    required this.userId,
  });

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  List<dynamic> _alerts = [];
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadAlerts();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAlerts() async {
    setState(() => _isLoading = true);

    try {
      final alerts = await ApiService().getAlerts(widget.userId);
      
      if (mounted) {
        setState(() {
          _alerts = alerts;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _alerts = [];
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load alerts: $e'),
            backgroundColor: PremiumColors.loss,
          ),
        );
      }
    }
  }

  List<dynamic> get _unreadAlerts => _alerts.where((a) => a['isRead'] == false).toList();
  List<dynamic> get _readAlerts => _alerts.where((a) => a['isRead'] == true).toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PremiumColors.deepDark,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(PremiumUI.spacingL),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(PremiumUI.spacingM),
                    decoration: BoxDecoration(
                      gradient: PremiumColors.primaryGradient,
                      borderRadius: BorderRadius.circular(PremiumUI.radiusL),
                    ),
                    child: const Icon(
                      Icons.notifications_rounded,
                      color: PremiumColors.deepDark,
                      size: PremiumUI.iconL,
                    ),
                  ),
                  const SizedBox(width: PremiumUI.spacingM),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Alerts',
                          style: PremiumTypography.h1,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${_unreadAlerts.length} unread',
                          style: PremiumTypography.caption.copyWith(
                            color: PremiumColors.neonTeal,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.add_rounded),
                    onPressed: _showCreateAlertDialog,
                  ),
                ],
              ),
            ),

            // Tabs
            Container(
              margin: const EdgeInsets.symmetric(horizontal: PremiumUI.spacingL),
              decoration: BoxDecoration(
                color: PremiumColors.surfaceBg,
                borderRadius: BorderRadius.circular(PremiumUI.radiusL),
              ),
              child: TabBar(
                controller: _tabController,
                indicator: BoxDecoration(
                  color: PremiumColors.neonTeal,
                  borderRadius: BorderRadius.circular(PremiumUI.radiusL),
                ),
                labelColor: PremiumColors.deepDark,
                unselectedLabelColor: PremiumColors.textMuted,
                labelStyle: PremiumTypography.body2.copyWith(fontWeight: FontWeight.w600),
                dividerColor: Colors.transparent,
                tabs: [
                  Tab(text: 'Unread (${_unreadAlerts.length})'),
                  Tab(text: 'Read (${_readAlerts.length})'),
                ],
              ),
            ),

            const SizedBox(height: PremiumUI.spacingL),

            // Content
            Expanded(
              child: _isLoading
                  ? _buildLoadingState()
                  : TabBarView(
                      controller: _tabController,
                      children: [
                        _buildAlertsList(_unreadAlerts, false),
                        _buildAlertsList(_readAlerts, true),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAlertsList(List<dynamic> alerts, bool isRead) {
    if (alerts.isEmpty) {
      return EmptyState(
        icon: isRead ? Icons.check_circle_outline : Icons.notifications_none,
        title: isRead ? 'All Caught Up!' : 'No New Alerts',
        subtitle: isRead
            ? 'You\'ve read all your alerts'
            : 'We\'ll notify you when something important happens',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadAlerts,
      color: PremiumColors.neonTeal,
      backgroundColor: PremiumColors.cardBg,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: PremiumUI.spacingL),
        itemCount: alerts.length,
        separatorBuilder: (context, index) => const SizedBox(height: PremiumUI.spacingM),
        itemBuilder: (context, index) => _buildAlertCard(alerts[index]),
      ),
    );
  }

  Widget _buildAlertCard(dynamic alert) {
    final severity = alert['severity']?.toString() ?? 'INFO';
    final isRead = alert['isRead'] ?? false;
    final createdAt = DateTime.tryParse(alert['createdAt'] ?? '') ?? DateTime.now();
    
    Color severityColor;
    IconData severityIcon;
    
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        severityColor = PremiumColors.loss;
        severityIcon = Icons.error_rounded;
        break;
      case 'MEDIUM':
        severityColor = PremiumColors.warning;
        severityIcon = Icons.warning_rounded;
        break;
      default:
        severityColor = PremiumColors.info;
        severityIcon = Icons.info_rounded;
    }

    return PremiumCard(
      onTap: () => _markAsRead(alert),
      padding: const EdgeInsets.all(PremiumUI.spacingL),
      backgroundColor: isRead ? PremiumColors.cardBg : PremiumColors.surfaceBg,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(PremiumUI.spacingS),
            decoration: BoxDecoration(
              color: severityColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(PremiumUI.radiusM),
            ),
            child: Icon(
              severityIcon,
              color: severityColor,
              size: PremiumUI.iconL,
            ),
          ),
          const SizedBox(width: PremiumUI.spacingM),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      alert['symbol']?.toString() ?? 'N/A',
                      style: PremiumTypography.body1.copyWith(
                        fontWeight: FontWeight.w600,
                        fontFamily: PremiumTypography.numericFont,
                      ),
                    ),
                    const SizedBox(width: PremiumUI.spacingS),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: severityColor.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(PremiumUI.radiusS),
                      ),
                      child: Text(
                        severity,
                        style: PremiumTypography.caption.copyWith(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: severityColor,
                        ),
                      ),
                    ),
                    const Spacer(),
                    if (!isRead)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: PremiumColors.neonTeal,
                          shape: BoxShape.circle,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: PremiumUI.spacingS),
                Text(
                  alert['message']?.toString() ?? 'No message',
                  style: PremiumTypography.body2,
                ),
                const SizedBox(height: PremiumUI.spacingS),
                Text(
                  _formatTime(createdAt),
                  style: PremiumTypography.caption,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return ListView.separated(
      padding: const EdgeInsets.all(PremiumUI.spacingL),
      itemCount: 5,
      separatorBuilder: (context, index) => const SizedBox(height: PremiumUI.spacingM),
      itemBuilder: (context, index) => const ShimmerLoading(
        child: PremiumCard(
          padding: EdgeInsets.all(PremiumUI.spacingL),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(radius: 20, backgroundColor: PremiumColors.surfaceBg),
                  SizedBox(width: PremiumUI.spacingM),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          width: 100,
                          height: 16,
                          child: ColoredBox(color: PremiumColors.surfaceBg),
                        ),
                        SizedBox(height: 8),
                        SizedBox(
                          width: 200,
                          height: 12,
                          child: ColoredBox(color: PremiumColors.surfaceBg),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _markAsRead(dynamic alert) {
    setState(() {
      alert['isRead'] = true;
    });
    // TODO: Call API to mark as read
  }

  void _showCreateAlertDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: PremiumColors.cardBg,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(PremiumUI.radiusXL),
        ),
        title: Text(
          'Create Alert',
          style: PremiumTypography.h3,
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              style: PremiumTypography.body1,
              decoration: const InputDecoration(
                labelText: 'Symbol',
                hintText: 'e.g., TCS',
              ),
            ),
            const SizedBox(height: PremiumUI.spacingM),
            TextField(
              style: PremiumTypography.body1,
              decoration: const InputDecoration(
                labelText: 'Condition',
                hintText: 'e.g., Price above 3500',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancel',
              style: PremiumTypography.body2.copyWith(
                color: PremiumColors.textMuted,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: Create alert via API
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);

    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${time.day}/${time.month}/${time.year}';
    }
  }
}
