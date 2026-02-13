import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../theme/premium_theme.dart';
import 'auth_sheet.dart';

class LoginRequiredView extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;

  const LoginRequiredView({
    super.key,
    required this.title,
    required this.subtitle,
    this.icon = Icons.lock_outline_rounded,
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
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: PremiumColors.neonTeal.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(icon, size: 42, color: PremiumColors.neonTeal),
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
            const SizedBox(height: PremiumUI.spacingL),
            ElevatedButton.icon(
              onPressed: () async {
                final loggedIn = await showAuthSheet(context);
                if (!context.mounted || !loggedIn) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Welcome, ${AuthService.instance.currentUser?.name ?? 'Investor'}',
                    ),
                    backgroundColor: PremiumColors.profit,
                  ),
                );
              },
              icon: const Icon(Icons.login_rounded),
              label: const Text('Login or Register'),
            ),
          ],
        ),
      ),
    );
  }
}
