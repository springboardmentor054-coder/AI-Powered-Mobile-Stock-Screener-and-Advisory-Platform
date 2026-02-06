import 'package:flutter/material.dart';
import '../theme/premium_theme.dart';
import '../widgets/premium_card.dart';
import '../services/api_service.dart';
import 'result_screen_premium.dart';

class SavedScreenersScreen extends StatefulWidget {
  final int userId;

  const SavedScreenersScreen({
    super.key,
    required this.userId,
  });

  @override
  State<SavedScreenersScreen> createState() => _SavedScreenersScreenState();
}

class _SavedScreenersScreenState extends State<SavedScreenersScreen> {
  bool _isLoading = true;
  List<dynamic> _screeners = [];

  @override
  void initState() {
    super.initState();
    _loadScreeners();
  }

  Future<void> _loadScreeners() async {
    setState(() => _isLoading = true);

    try {
      final screeners = await ApiService().getSavedScreeners(widget.userId);
      
      if (mounted) {
        setState(() {
          _screeners = screeners;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _screeners = [];
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load saved screeners: $e'),
            backgroundColor: PremiumColors.loss,
          ),
        );
      }
    }
  }

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
                      gradient: PremiumColors.purpleGradient,
                      borderRadius: BorderRadius.circular(PremiumUI.radiusL),
                    ),
                    child: const Icon(
                      Icons.bookmark_rounded,
                      color: Colors.white,
                      size: PremiumUI.iconL,
                    ),
                  ),
                  const SizedBox(width: PremiumUI.spacingM),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Saved Screeners',
                          style: PremiumTypography.h1,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${_screeners.length} saved',
                          style: PremiumTypography.caption.copyWith(
                            color: PremiumColors.softPurple,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Content
            Expanded(
              child: _isLoading
                  ? _buildLoadingState()
                  : _screeners.isEmpty
                      ? EmptyState(
                          icon: Icons.bookmark_border_rounded,
                          title: 'No Saved Screeners',
                          subtitle: 'Save your favorite searches for quick access',
                          action: ElevatedButton(
                            onPressed: () {
                              // Navigate to home screen
                            },
                            child: const Text('Create Your First'),
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadScreeners,
                          color: PremiumColors.neonTeal,
                          backgroundColor: PremiumColors.cardBg,
                          child: ListView.separated(
                            padding: const EdgeInsets.symmetric(
                              horizontal: PremiumUI.spacingL,
                            ),
                            itemCount: _screeners.length,
                            separatorBuilder: (context, index) =>
                                const SizedBox(height: PremiumUI.spacingM),
                            itemBuilder: (context, index) =>
                                _buildScreenerCard(_screeners[index]),
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScreenerCard(dynamic screener) {
    final lastRun = DateTime.tryParse(screener['lastRun'] ?? '') ?? DateTime.now();
    final resultCount = screener['resultCount'] ?? 0;
    final conditions = screener['conditions'] as Map<String, dynamic>? ?? {};

    return PremiumCard(
      onTap: () => _runScreener(screener),
      padding: const EdgeInsets.all(PremiumUI.spacingL),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  screener['name']?.toString() ?? 'Unnamed Screener',
                  style: PremiumTypography.h3.copyWith(fontSize: 18),
                ),
              ),
              PopupMenuButton(
                color: PremiumColors.surfaceBg,
                icon: const Icon(
                  Icons.more_vert_rounded,
                  color: PremiumColors.textMuted,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(PremiumUI.radiusL),
                ),
                itemBuilder: (context) => [
                  PopupMenuItem(
                    child: Row(
                      children: [
                        const Icon(Icons.edit_rounded, size: 18),
                        const SizedBox(width: PremiumUI.spacingS),
                        Text('Edit', style: PremiumTypography.body2),
                      ],
                    ),
                    onTap: () => _editScreener(screener),
                  ),
                  PopupMenuItem(
                    child: Row(
                      children: [
                        const Icon(Icons.delete_rounded, size: 18, color: PremiumColors.loss),
                        const SizedBox(width: PremiumUI.spacingS),
                        Text(
                          'Delete',
                          style: PremiumTypography.body2.copyWith(
                            color: PremiumColors.loss,
                          ),
                        ),
                      ],
                    ),
                    onTap: () => _deleteScreener(screener),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: PremiumUI.spacingS),
          Text(
            screener['query']?.toString() ?? '',
            style: PremiumTypography.body2,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: PremiumUI.spacingM),
          Wrap(
            spacing: PremiumUI.spacingS,
            runSpacing: PremiumUI.spacingS,
            children: conditions.entries.map((entry) {
              return Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: PremiumUI.spacingM,
                  vertical: PremiumUI.spacingS,
                ),
                decoration: BoxDecoration(
                  color: PremiumColors.neonTeal.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(PremiumUI.radiusM),
                  border: Border.all(
                    color: PremiumColors.neonTeal.withOpacity(0.3),
                  ),
                ),
                child: Text(
                  '${entry.key}: ${entry.value}',
                  style: PremiumTypography.caption.copyWith(
                    color: PremiumColors.neonTeal,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: PremiumUI.spacingM),
          Divider(
            color: PremiumColors.divider,
            height: 1,
          ),
          const SizedBox(height: PremiumUI.spacingM),
          Row(
            children: [
              Icon(
                Icons.history_rounded,
                size: PremiumUI.iconM,
                color: PremiumColors.textMuted,
              ),
              const SizedBox(width: PremiumUI.spacingS),
              Text(
                'Last run ${_formatTime(lastRun)}',
                style: PremiumTypography.caption,
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: PremiumUI.spacingM,
                  vertical: PremiumUI.spacingS,
                ),
                decoration: BoxDecoration(
                  color: PremiumColors.surfaceBg,
                  borderRadius: BorderRadius.circular(PremiumUI.radiusM),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.show_chart_rounded,
                      size: 14,
                      color: PremiumColors.neonTeal,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '$resultCount stocks',
                      style: PremiumTypography.caption.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
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
              SizedBox(
                width: 150,
                height: 20,
                child: ColoredBox(color: PremiumColors.surfaceBg),
              ),
              SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 14,
                child: ColoredBox(color: PremiumColors.surfaceBg),
              ),
              SizedBox(height: 8),
              SizedBox(
                width: 200,
                height: 14,
                child: ColoredBox(color: PremiumColors.surfaceBg),
              ),
              SizedBox(height: 16),
              Row(
                children: [
                  SizedBox(
                    width: 80,
                    height: 24,
                    child: ColoredBox(color: PremiumColors.surfaceBg),
                  ),
                  SizedBox(width: 8),
                  SizedBox(
                    width: 80,
                    height: 24,
                    child: ColoredBox(color: PremiumColors.surfaceBg),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _runScreener(dynamic screener) async {
    try {
      final results = await ApiService().fetchStocks(screener['query']);
      
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ResultScreen(
              results: results,
              query: screener['query'],
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to run screener: $e'),
            backgroundColor: PremiumColors.loss,
          ),
        );
      }
    }
  }

  void _editScreener(dynamic screener) {
    // TODO: Implement edit functionality
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Edit functionality coming soon'),
            backgroundColor: PremiumColors.info,
          ),
        );
      }
    });
  }

  void _deleteScreener(dynamic screener) {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            backgroundColor: PremiumColors.cardBg,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(PremiumUI.radiusXL),
            ),
            title: Text(
              'Delete Screener?',
              style: PremiumTypography.h3,
            ),
            content: Text(
              'This will permanently delete "${screener['name']}". This action cannot be undone.',
              style: PremiumTypography.body2,
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
                  setState(() {
                    _screeners.remove(screener);
                  });
                  Navigator.pop(context);
                  // TODO: Call API to delete
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: PremiumColors.loss,
                ),
                child: const Text('Delete'),
              ),
            ],
          ),
        );
      }
    });
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
