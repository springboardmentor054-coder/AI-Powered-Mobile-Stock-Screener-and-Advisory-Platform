import 'package:flutter/material.dart';
import 'dart:async';

/// Rate limit error response model
class RateLimitError {
  final int statusCode;
  final String message;
  final int? retryAfterSeconds;
  final DateTime occurredAt;

  RateLimitError({
    required this.statusCode,
    this.message = 'API rate limit exceeded',
    this.retryAfterSeconds,
  }) : occurredAt = DateTime.now();

  bool get isRateLimited => statusCode == 429;
}

/// Rate limit handler - manages retry logic and user feedback
class RateLimitHandler {
  int _retryCount = 0;
  static const int MAX_RETRIES = 3;
  static const int BASE_DELAY_SECONDS = 2;

  /// Calculate exponential backoff delay
  Duration getBackoffDelay() {
    if (_retryCount >= MAX_RETRIES) {
      return const Duration(seconds: 60); // Final fallback: 1 minute
    }
    
    // Exponential backoff: 2s, 4s, 8s
    final delaySeconds = BASE_DELAY_SECONDS * (1 << _retryCount);
    return Duration(seconds: delaySeconds);
  }

  /// Reset retry counter
  void reset() {
    _retryCount = 0;
  }

  /// Increment retry counter
  void incrementRetry() {
    if (_retryCount < MAX_RETRIES) {
      _retryCount++;
    }
  }

  /// Check if we should retry
  bool shouldRetry() => _retryCount < MAX_RETRIES;

  /// Get retry count
  int get retryCount => _retryCount;
}

/// Rate limit notification banner
/// Shows countdown timer for rate limit recovery
class RateLimitBanner extends StatefulWidget {
  final RateLimitError error;
  final VoidCallback? onRetry;
  final Duration autoHideDuration;

  const RateLimitBanner({
    required this.error,
    this.onRetry,
    this.autoHideDuration = const Duration(seconds: 8),
    Key? key,
  }) : super(key: key);

  @override
  State<RateLimitBanner> createState() => _RateLimitBannerState();
}

class _RateLimitBannerState extends State<RateLimitBanner> {
  late Timer _countdownTimer;
  late Duration _remainingTime;

  @override
  void initState() {
    super.initState();
    _remainingTime = widget.error.retryAfterSeconds != null
        ? Duration(seconds: widget.error.retryAfterSeconds!)
        : const Duration(seconds: 30); // Default retry after 30s

    _startCountdown();
  }

  void _startCountdown() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        if (_remainingTime.inSeconds > 0) {
          _remainingTime = Duration(seconds: _remainingTime.inSeconds - 1);
        } else {
          timer.cancel();
        }
      });
    });
  }

  @override
  void dispose() {
    _countdownTimer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final canRetry = _remainingTime.inSeconds <= 0;

    return Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        border: Border.all(color: Colors.red, width: 2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with icon
          Row(
            children: [
              Icon(
                Icons.schedule,
                color: Colors.red[700],
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '⏱️ API Rate Limited',
                  style: TextStyle(
                    color: Colors.red[700],
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
            'Too many requests sent to the server. Please wait before trying again.',
            style: TextStyle(
              color: Colors.red[600],
              fontSize: 12,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),

          // Countdown timer and retry button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  canRetry
                      ? '✅ Ready to retry'
                      : 'Retry in ${_remainingTime.inSeconds}s',
                  style: TextStyle(
                    color: canRetry ? Colors.green[700] : Colors.red[700],
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              if (canRetry && widget.onRetry != null)
                ElevatedButton.icon(
                  onPressed: widget.onRetry,
                  icon: const Icon(Icons.refresh, size: 16),
                  label: const Text('Retry Now'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                )
              else
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0),
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.red[700]!),
                    ),
                  ),
                ),
            ],
          ),

          // Help text
          Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: Text(
              '💡 Tip: Close and reopen the app to reset the rate limit counter',
              style: TextStyle(
                color: Colors.grey[700],
                fontSize: 11,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Snackbar helper for rate limit messages
class RateLimitSnackBar {
  static void show(
    BuildContext context,
    RateLimitError error, {
    VoidCallback? onRetry,
  }) {
    final messenger = ScaffoldMessenger.of(context);
    
    // Clear any existing snackbars
    messenger.clearSnackBars();

    messenger.showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.schedule, size: 16, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                error.message,
                style: const TextStyle(fontSize: 12),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.red.shade700,
        duration: const Duration(seconds: 10),
        action: onRetry != null
            ? SnackBarAction(
                label: 'RETRY',
                textColor: Colors.white,
                onPressed: onRetry,
              )
            : null,
      ),
    );
  }
}

/// Decorator for API calls to handle rate limiting
class RateLimitedApiCall {
  final RateLimitHandler handler;

  RateLimitedApiCall({RateLimitHandler? handler})
      : handler = handler ?? RateLimitHandler();

  /// Wrapper for API calls with rate limit handling
  Future<T?> execute<T>(
    Future<T> Function() apiCall, {
    BuildContext? context,
    VoidCallback? onSuccess,
    VoidCallback? onError,
    bool stopOnRateLimit = false,
  }) async {
    try {
      handler.reset();
      final result = await apiCall();
      onSuccess?.call();
      return result;
    } catch (error) {
      if (error is RateLimitError && error.isRateLimited) {
        if (context != null) {
          RateLimitSnackBar.show(context, error);
        }

        if (stopOnRateLimit) {
          return null; // Abort further retries
        }

        // Exponential backoff retry
        if (handler.shouldRetry()) {
          handler.incrementRetry();
          final delay = handler.getBackoffDelay();
          
          await Future.delayed(delay);
          return execute(apiCall, context: context, onSuccess: onSuccess);
        }
      }

      onError?.call();
      rethrow;
    }
  }
}
