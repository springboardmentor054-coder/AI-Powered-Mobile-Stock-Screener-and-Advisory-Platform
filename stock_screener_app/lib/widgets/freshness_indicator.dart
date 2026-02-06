import 'package:flutter/material.dart';

/// Data freshness indicator widget
/// Shows visual badge and warning message for data age
class FreshnessIndicator extends StatelessWidget {
  final Map<String, dynamic>? freshness;
  final VoidCallback? onRefresh;

  const FreshnessIndicator({
    this.freshness,
    this.onRefresh,
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (freshness == null) {
      return const SizedBox.shrink();
    }

    final status = freshness!['status'] ?? 'UNKNOWN';
    final ageMinutes = freshness!['age_minutes'] ?? -1;
    final badge = freshness!['delay_badge'] ?? '❌ Unknown';
    final warning = freshness!['warning'] ?? '';
    final color = _getColorForStatus(status);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Column(
        children: [
          // Badge Row
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  border: Border.all(color: color, width: 1.5),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  badge,
                  style: TextStyle(
                    color: color,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              if (ageMinutes >= 0)
                Expanded(
                  child: Text(
                    _getRelativeTime(ageMinutes),
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 12,
                    ),
                  ),
                ),
              if (onRefresh != null)
                GestureDetector(
                  onTap: onRefresh,
                  child: Padding(
                    padding: const EdgeInsets.only(left: 8.0),
                    child: Icon(
                      Icons.refresh,
                      size: 18,
                      color: Colors.blue[700],
                    ),
                  ),
                ),
            ],
          ),

          // Warning message (if stale)
          if (warning.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  border: Border.all(color: color.withOpacity(0.3)),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        warning,
                        style: TextStyle(
                          color: color,
                          fontSize: 11,
                          height: 1.4,
                        ),
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

  /// Get color based on data freshness status
  Color _getColorForStatus(String status) {
    switch (status.toUpperCase()) {
      case 'FRESH':
        return Colors.green;
      case 'STALE':
        return Colors.orange;
      case 'VERY_STALE':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  /// Get human-readable relative time string
  String _getRelativeTime(int ageMinutes) {
    if (ageMinutes < 1) return 'Just now';
    if (ageMinutes < 60) return 'Updated ${ageMinutes}m ago';

    final hours = (ageMinutes / 60).floor();
    if (hours < 24) return 'Updated ${hours}h ago';

    final days = (hours / 24).floor();
    return 'Updated ${days}d ago';
  }
}

/// Stale data warning banner
/// Shows emphasis warning for old data
class StaleDataWarning extends StatelessWidget {
  final Map<String, dynamic> freshness;
  final String? title;

  const StaleDataWarning({
    required this.freshness,
    this.title,
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final status = freshness['status'] ?? 'UNKNOWN';
    final isStale = status != 'FRESH';

    if (!isStale) {
      return const SizedBox.shrink();
    }

    final isVeryStale = status == 'VERY_STALE';
    final color = isVeryStale ? Colors.red : Colors.orange;

    return Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        border: Border.all(color: color, width: 2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title
          Row(
            children: [
              Icon(
                isVeryStale ? Icons.warning : Icons.info,
                color: color,
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title ?? (isVeryStale ? '⚠️ Critical: Old Data' : '⏱️ Delayed Data'),
                  style: TextStyle(
                    color: color,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Message
          Text(
            freshness['warning'] ?? 'Data may not be current',
            style: TextStyle(
              color: color,
              fontSize: 12,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          // Recommendation
          GestureDetector(
            onTap: () {
              // User can trigger refresh from parent
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Refreshing data...'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
            child: Text(
              'Tap to refresh data',
              style: TextStyle(
                color: Colors.blue[700],
                fontSize: 12,
                fontWeight: FontWeight.w600,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Last updated timestamp widget
/// Displays when data was last refreshed
class LastUpdatedWidget extends StatelessWidget {
  final DateTime? lastUpdated;
  final bool showRelativeTime;

  const LastUpdatedWidget({
    this.lastUpdated,
    this.showRelativeTime = true,
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (lastUpdated == null) {
      return const SizedBox.shrink();
    }

    String timeText;
    if (showRelativeTime) {
      timeText = _getRelativeTime(lastUpdated!);
    } else {
      // Show absolute time
      timeText = '${lastUpdated!.hour}:${lastUpdated!.minute.toString().padLeft(2, '0')}';
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Text(
        'Last updated: $timeText',
        style: TextStyle(
          color: Colors.grey[600],
          fontSize: 11,
        ),
      ),
    );
  }

  String _getRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inDays}d ago';
    }
  }
}
