import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/premium_theme.dart';

/// Premium Glassmorphic Card with multiple variants
class PremiumCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final bool useGlass;
  final Gradient? gradient;
  final Color? backgroundColor;
  final double? height;
  final double? width;
  final BorderRadius? borderRadius;
  
  const PremiumCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
    this.useGlass = false,
    this.gradient,
    this.backgroundColor,
    this.height,
    this.width,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final content = Container(
      height: height,
      width: width,
      padding: padding ?? const EdgeInsets.all(PremiumUI.spacingL),
      decoration: BoxDecoration(
        color: useGlass ? null : (backgroundColor ?? PremiumColors.cardBg),
        gradient: gradient,
        borderRadius: borderRadius ?? BorderRadius.circular(PremiumUI.radiusXL),
        border: useGlass
            ? Border.all(
                color: PremiumColors.overlay,
                width: 1,
              )
            : null,
        boxShadow: useGlass ? null : PremiumUI.softShadow(),
      ),
      child: useGlass
          ? ClipRRect(
              borderRadius: borderRadius ?? BorderRadius.circular(PremiumUI.radiusXL),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  decoration: BoxDecoration(
                    color: PremiumColors.glassBg,
                  ),
                  child: child,
                ),
              ),
            )
          : child,
    );

    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        borderRadius: borderRadius ?? BorderRadius.circular(PremiumUI.radiusXL),
        child: InkWell(
          onTap: onTap,
          borderRadius: borderRadius ?? BorderRadius.circular(PremiumUI.radiusXL),
          splashColor: PremiumColors.neonTeal.withOpacity(0.1),
          highlightColor: PremiumColors.neonTeal.withOpacity(0.05),
          child: content,
        ),
      );
    }

    return content;
  }
}

/// Premium Stock Price Change Chip
class PriceChangeChip extends StatelessWidget {
  final double change;
  final double changePercent;
  final bool isSmall;

  const PriceChangeChip({
    super.key,
    required this.change,
    required this.changePercent,
    this.isSmall = false,
  });

  @override
  Widget build(BuildContext context) {
    final isPositive = change >= 0;
    final color = isPositive ? PremiumColors.profit : PremiumColors.loss;
    final icon = isPositive ? Icons.arrow_upward : Icons.arrow_downward;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isSmall ? 8 : 12,
        vertical: isSmall ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(PremiumUI.radiusM),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: isSmall ? 12 : 14,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(
            '${changePercent.toStringAsFixed(2)}%',
            style: (isSmall ? PremiumTypography.caption : PremiumTypography.body2).copyWith(
              color: color,
              fontWeight: FontWeight.w600,
              fontFamily: PremiumTypography.numericFont,
            ),
          ),
        ],
      ),
    );
  }
}

/// Premium Stat Card with Icon
class StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Gradient? gradient;
  final Color? iconColor;

  const StatCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.gradient,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return PremiumCard(
      gradient: gradient,
      padding: const EdgeInsets.all(PremiumUI.spacingM),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(PremiumUI.spacingS),
            decoration: BoxDecoration(
              color: (iconColor ?? PremiumColors.neonTeal).withOpacity(0.1),
              borderRadius: BorderRadius.circular(PremiumUI.radiusM),
            ),
            child: Icon(
              icon,
              size: PremiumUI.iconL,
              color: iconColor ?? PremiumColors.neonTeal,
            ),
          ),
          const SizedBox(height: PremiumUI.spacingM),
          Text(
            label,
            style: PremiumTypography.caption,
          ),
          const SizedBox(height: PremiumUI.spacingXS),
          Text(
            value,
            style: PremiumTypography.priceMedium,
          ),
        ],
      ),
    );
  }
}

/// Premium Section Header
class SectionHeader extends StatelessWidget {
  final String title;
  final String? trailing;
  final VoidCallback? onTrailingTap;
  final IconData? icon;

  const SectionHeader({
    super.key,
    required this.title,
    this.trailing,
    this.onTrailingTap,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: PremiumUI.spacingL,
        vertical: PremiumUI.spacingM,
      ),
      child: Row(
        children: [
          if (icon != null) ...[
            Icon(icon, size: PremiumUI.iconL, color: PremiumColors.neonTeal),
            const SizedBox(width: PremiumUI.spacingS),
          ],
          Text(
            title,
            style: PremiumTypography.h3,
          ),
          const Spacer(),
          if (trailing != null)
            GestureDetector(
              onTap: onTrailingTap,
              child: Text(
                trailing!,
                style: PremiumTypography.body2.copyWith(
                  color: PremiumColors.neonTeal,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Premium Shimmer Loading Effect
class ShimmerLoading extends StatefulWidget {
  final Widget child;
  final bool isLoading;

  const ShimmerLoading({
    super.key,
    required this.child,
    this.isLoading = true,
  });

  @override
  State<ShimmerLoading> createState() => _ShimmerLoadingState();
}

class _ShimmerLoadingState extends State<ShimmerLoading>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isLoading) {
      return widget.child;
    }

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return ShaderMask(
          shaderCallback: (bounds) {
            return LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: const [
                PremiumColors.cardBg,
                PremiumColors.surfaceBg,
                PremiumColors.cardBg,
              ],
              stops: [
                _controller.value - 0.3,
                _controller.value,
                _controller.value + 0.3,
              ],
            ).createShader(bounds);
          },
          child: widget.child,
        );
      },
    );
  }
}

/// Premium Empty State
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? action;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(PremiumUI.spacingXL),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(PremiumUI.spacingL),
              decoration: BoxDecoration(
                color: PremiumColors.neonTeal.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 64,
                color: PremiumColors.neonTeal,
              ),
            ),
            const SizedBox(height: PremiumUI.spacingL),
            Text(
              title,
              style: PremiumTypography.h2,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: PremiumUI.spacingS),
            Text(
              subtitle,
              style: PremiumTypography.body2,
              textAlign: TextAlign.center,
            ),
            if (action != null) ...[
              const SizedBox(height: PremiumUI.spacingL),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}
