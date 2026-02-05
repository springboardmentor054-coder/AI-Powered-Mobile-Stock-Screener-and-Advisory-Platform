# Flutter Frontend Setup Guide

## ✅ Frontend Implementation Complete!

A complete Flutter mobile app with authentication integrated with your backend.

---

## What Was Built

### 1. **Authentication Services**
- **API Service** ([lib/services/api_service.dart](frontend/mobile_app/lib/services/api_service.dart))
  - HTTP client for backend communication
  - Handles GET/POST requests
  - Token-based authentication
  - Error handling

- **Auth Service** ([lib/services/auth_service.dart](frontend/mobile_app/lib/services/auth_service.dart))
  - Signup functionality
  - Login functionality
  - Token management (SharedPreferences)
  - User session persistence
  - Logout functionality

### 2. **User Interface Screens**
- **Login Screen** ([lib/screens/login_screen.dart](frontend/mobile_app/lib/screens/login_screen.dart))
  - Email/password form
  - Form validation
  - Error handling
  - Navigation to signup

- **Signup Screen** ([lib/screens/signup_screen.dart](frontend/mobile_app/lib/screens/signup_screen.dart))
  - Name/email/password form
  - Password confirmation
  - Form validation
  - Navigation back to login

- **Home Screen** ([lib/screens/home_screen.dart](frontend/mobile_app/lib/screens/home_screen.dart))
  - Welcome card with user info
  - Feature cards (Stock Screener, Market Analysis, Watchlist, Alerts)
  - Logout functionality

### 3. **Authentication Flow**
- Auto-login on app launch (if token exists)
- Session persistence across app restarts
- Secure token storage
- Automatic redirect after login/signup

---

## How to Run the App

### Step 1: Make Sure Backend is Running
```powershell
cd backend
npm start
```

### Step 2: Configure API URL

**For Android Emulator:**
The app is pre-configured to use `http://10.0.2.2:5000` (Android Emulator's localhost)

**For iOS Simulator:**
Edit [lib/services/api_service.dart](frontend/mobile_app/lib/services/api_service.dart):
```dart
static const String baseUrl = 'http://localhost:5000';
```

**For Physical Device:**
Replace with your computer's IP address:
```dart
static const String baseUrl = 'http://192.168.x.x:5000';
```

To find your IP:
```powershell
ipconfig
# Look for "IPv4 Address"
```

### Step 3: Run the App

**Option 1: Using Command Line**
```powershell
cd frontend/mobile_app
flutter run
```

**Option 2: Using VS Code**
1. Open `frontend/mobile_app` folder in VS Code
2. Press `F5` or click "Run > Start Debugging"
3. Select your device (emulator/simulator/physical device)

**Option 3: Using Android Studio**
1. Open `frontend/mobile_app` folder
2. Wait for Gradle sync
3. Click the green play button
4. Select your device

---

## Testing the App

### 1. **Test Signup**
- Launch the app
- Click "Sign Up"
- Enter:
  - Name: Your Name
  - Email: your@email.com
  - Password: password123
  - Confirm Password: password123
- Click "Sign Up"
- Should navigate to Home Screen

### 2. **Test Login**
- Close and reopen the app
- Should automatically login (token persists)
- If logged out, use same credentials to login

### 3. **Test Logout**
- Click logout icon in AppBar
- Confirm logout
- Should return to Login Screen

### 4. **Test Token Persistence**
- Login
- Close the app completely (swipe away from recent apps)
- Reopen the app
- Should automatically show Home Screen (no login required)

---

## App Structure

```
lib/
├── main.dart                     # App entry point + auth checker
├── services/
│   ├── api_service.dart         # HTTP client
│   └── auth_service.dart        # Authentication logic
└── screens/
    ├── login_screen.dart        # Login UI
    ├── signup_screen.dart       # Signup UI
    └── home_screen.dart         # Home dashboard
```

---

## API Integration

### Signup
```dart
final authService = AuthService();
await authService.signup(
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
);
```

### Login
```dart
await authService.login(
  email: 'user@example.com',
  password: 'password123',
);
```

### Check Authentication
```dart
final isLoggedIn = await authService.isLoggedIn();
```

### Get User Info
```dart
final userInfo = await authService.getUserInfo();
// Returns: { id, email, name }
```

### Logout
```dart
await authService.logout();
```

---

## Common Issues & Solutions

### Issue 1: "Connection refused" or "Network error"
**Solution:**
- Make sure backend is running (check terminal where you ran `npm start`)
- Check the API URL in `api_service.dart`
  - Android Emulator: `http://10.0.2.2:5000`
  - iOS Simulator: `http://localhost:5000`
  - Physical Device: `http://YOUR_COMPUTER_IP:5000`
- Check firewall isn't blocking port 5000

### Issue 2: "Invalid email or password" on first login
**Solution:**
- Use the Signup screen first to create an account
- Backend stores users in PostgreSQL database

### Issue 3: Flutter packages not found
**Solution:**
```powershell
cd frontend/mobile_app
flutter pub get
flutter clean
flutter pub get
```

### Issue 4: Can't connect from physical device
**Solution:**
1. Find your computer's IP:
   ```powershell
   ipconfig
   ```
2. Update API URL in `api_service.dart`
3. Make sure phone and computer are on same WiFi network
4. Allow port 5000 through Windows Firewall

---

## Features Implemented

### ✅ Authentication
- [x] User signup with validation
- [x] User login with JWT tokens
- [x] Token persistence (stays logged in)
- [x] Auto-login on app launch
- [x] Logout functionality
- [x] Password visibility toggle
- [x] Form validation

### ✅ Security
- [x] Secure token storage (SharedPreferences)
- [x] Password field masking
- [x] Email format validation
- [x] Password length validation
- [x] Bearer token authentication

### ✅ User Experience
- [x] Loading indicators
- [x] Error messages
- [x] Navigation between screens
- [x] Welcome message with user name
- [x] Material Design UI
- [x] Responsive layout

---

## Next Steps (To Implement)

### Integrate Existing Stock Screener
The old `ScreenerPage` is still in main.dart (lines 70-529). You can:
1. Add a navigation button from Home Screen to Stock Screener
2. Protect the screener with authentication (require token)
3. Send user token with screener API requests

Example:
```dart
// In home_screen.dart, update Stock Screener feature card:
_FeatureCard(
  icon: Icons.search,
  title: 'Stock Screener',
  description: 'Find stocks matching your criteria',
  color: Colors.blue,
  onTap: () {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const ScreenerPage()),
    );
  },
),
```

### Additional Features to Build
1. **User Profile Screen**
   - Edit name/email
   - Change password
   - View account details

2. **Watchlist**
   - Save favorite stocks
   - Get price alerts

3. **Market Analysis**
   - AI-powered insights
   - Sector analysis

4. **Push Notifications**
   - Price alerts
   - Market updates

---

## Backend Connection Summary

| Environment | Base URL | Notes |
|------------|----------|-------|
| Android Emulator | `http://10.0.2.2:5000` | Default (already configured) |
| iOS Simulator | `http://localhost:5000` | Need to change |
| Physical Device | `http://YOUR_IP:5000` | Need your computer's IP |
| Production | `https://your-domain.com` | Deploy backend first |

---

## Testing Credentials

After running the backend test script, you have:
- **Email:** test@example.com
- **Password:** password123
- **Name:** Test User

Or create your own account using the Signup screen!

---

## Ready to Test!

1. ✅ Backend running on port 5000
2. ✅ Database has users table
3. ✅ Flutter app configured
4. ✅ All screens created
5. ✅ Authentication flow working

**Run the app:**
```powershell
cd frontend/mobile_app
flutter run
```

🎉 **Your mobile app is ready to use!**
