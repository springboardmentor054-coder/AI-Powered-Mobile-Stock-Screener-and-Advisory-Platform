import 'package:flutter/material.dart';

import 'screens/alerts_screen_premium.dart';
import 'screens/dashboard_screen_premium.dart';
import 'screens/home_screen_premium.dart';
import 'screens/portfolio_screen_premium.dart';
import 'screens/watchlist_screen_premium.dart';
import 'services/auth_service.dart';
import 'theme/premium_theme.dart';
import 'widgets/auth_sheet.dart';
import 'widgets/login_required_view.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AuthService.instance.initialize();
  runApp(const StockScreenerApp());
}

class StockScreenerApp extends StatelessWidget {
  const StockScreenerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'EquiScan',
      theme: PremiumTheme.lightTheme,
      darkTheme: PremiumTheme.darkTheme,
      themeMode: ThemeMode.light,
      home: const MainNavigation(),
    );
  }
}

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _selectedIndex = 0;

  static const Set<int> _authRequiredTabs = {1, 3, 4};

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: AuthService.instance,
      builder: (context, _) {
        final auth = AuthService.instance;
        final userId = auth.currentUserId ?? 1;
        final isAuthenticated = auth.isAuthenticated;

        final screens = <Widget>[
          const HomeScreen(),
          isAuthenticated
              ? WatchlistScreenPremium(userId: userId)
              : const LoginRequiredView(
                  title: 'Watchlist Requires Login',
                  subtitle:
                      'Sign in to save stocks and track live watchlist updates.',
                  icon: Icons.bookmark_border_rounded,
                ),
          DashboardScreen(onNavigateToTab: _onTabSelected),
          isAuthenticated
              ? PortfolioScreenPremium(
                  userId: userId,
                  userName: auth.currentUser?.name ?? 'Investor',
                  avatarLabel: auth.currentUser?.avatarLabel ?? 'EQ',
                )
              : const LoginRequiredView(
                  title: 'Portfolio Requires Login',
                  subtitle:
                      'Create an account to store and monitor your holdings.',
                  icon: Icons.pie_chart_outline_rounded,
                ),
          isAuthenticated
              ? AlertsScreen(userId: userId)
              : const LoginRequiredView(
                  title: 'Alerts Require Login',
                  subtitle: 'Login to create and manage personalized alerts.',
                  icon: Icons.notifications_none_rounded,
                ),
        ];

        return Scaffold(
          body: screens[_selectedIndex],
          bottomNavigationBar: BottomNavigationBar(
            currentIndex: _selectedIndex,
            onTap: _onTabSelected,
            type: BottomNavigationBarType.fixed,
            selectedItemColor: PremiumColors.neonTeal,
            unselectedItemColor: PremiumColors.textMuted,
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.search),
                label: 'Screen',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.bookmark),
                label: 'Watchlist',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.dashboard),
                label: 'Dashboard',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.account_circle_rounded),
                label: 'Account',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.notifications),
                label: 'Alerts',
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _onTabSelected(int index) async {
    final auth = AuthService.instance;
    if (_authRequiredTabs.contains(index) && !auth.isAuthenticated) {
      final loggedIn = await showAuthSheet(context);
      if (!mounted) return;
      if (!loggedIn) {
        setState(() => _selectedIndex = 0);
        return;
      }
    }

    if (!mounted) return;
    setState(() => _selectedIndex = index);
  }
}
