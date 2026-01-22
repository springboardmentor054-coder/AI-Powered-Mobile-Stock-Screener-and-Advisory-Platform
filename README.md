# 🚀 AI-Powered Stock Screener Pro

An intelligent mobile stock screening application powered by AI that allows users to search and analyze stocks using natural language queries.

![Flutter](https://img.shields.io/badge/Flutter-3.0+-02569B?logo=flutter)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## ✨ Features

- 🤖 **AI-Powered Natural Language Processing** - Search stocks using plain English queries
- 📊 **Advanced Market Insights** - Comprehensive P/E ratio analysis, market cap statistics, and sector distribution
- 🎨 **Modern Material Design 3 UI** - Beautiful, responsive interface with smooth animations
- ⚡ **Real-time Stock Screening** - Fast query processing with optimized database operations
- 📈 **Detailed Stock Cards** - View key metrics including P/E ratio, PEG ratio, debt to FCF, and more
- 🔍 **Smart Filtering** - Sort results by market cap, P/E ratio, or PEG ratio
- 🌓 **Dark Mode Support** - Automatic theme switching based on system preferences
- 🎯 **Server Health Monitoring** - Live backend connection status indicator

## 📱 Screenshots

### Home Screen
- Clean, gradient-based design
- Real-time server status indicator
- Example query suggestions
- Feature highlights

### Results Screen
- Comprehensive market insights panel
- Interactive sector distribution charts
- Sortable stock listings
- Detailed metric cards with color-coded indicators

## 🏗️ Architecture

### Frontend (Flutter)
```
stock_screener_app/
├── lib/
│   ├── main.dart                 # App entry point with Material 3 theming
│   ├── screens/
│   │   ├── home_screen.dart      # Search interface with server health check
│   │   └── result_screen.dart    # Results display with enhanced insights
│   └── services/
│       └── api_service.dart      # HTTP client for backend communication
```

### Backend (Node.js + Express)
```
backend/
├── app.js                        # Express app configuration
├── server.js                     # Server initialization
├── database.js                   # PostgreSQL connection pool
├── llm.js                        # Groq AI integration for NLP
├── compileDSL.js                 # DSL to SQL compiler
├── cache.js                      # Redis caching (optional)
├── routes/
│   └── screener.js              # Stock screening endpoint
├── services/
│   ├── marketData.service.js    # Market data operations
│   └── validationService.js     # Input validation
└── schema.sql                    # Database schema with sample data
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Flutter SDK 3.0+
- Groq API Key (free at [groq.com](https://groq.com))
- Redis (optional, for caching)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Stock_screener
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up PostgreSQL database**
   ```bash
   # Create database
   psql -U postgres
   CREATE DATABASE stock_screener;
   \q
   
   # Import schema and sample data
   psql -U postgres -d stock_screener -f schema.sql
   ```

4. **Configure environment variables**
   
   Create `backend/.env`:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=stock_screener
   DB_USER=postgres
   DB_PASSWORD=your_password

   # Server Configuration
   PORT=5000

   # Groq AI API
   GROQ_API_KEY=your_groq_api_key

   # Redis (Optional)
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

5. **Start the backend server**
   ```bash
   npm start
   ```
   
   Server should be running at `http://localhost:5000`

### Flutter App Setup

1. **Navigate to Flutter app directory**
   ```bash
   cd stock_screener_app
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Run the app**
   ```bash
   # For Android emulator/device
   flutter run
   
   # For iOS simulator (macOS only)
   flutter run -d ios
   
   # For web
   flutter run -d chrome
   ```

## 📖 Usage Guide

### Example Queries

The app understands natural language queries like:

- **"Show IT stocks with PE below 25"** - IT sector stocks with P/E ratio less than 25
- **"Finance stocks with PE below 20"** - Banking/Finance stocks with low P/E
- **"Healthcare stocks with low debt to FCF"** - Healthcare companies with low debt
- **"IT stocks with PEG ratio less than 2"** - Technology stocks with good growth prospects

### Query Syntax

**Supported Sectors:**
- IT (Information Technology)
- Finance (Banking & Financial Services)
- Healthcare
- And more (check database)

**Supported Metrics:**
- `pe_ratio` - Price-to-Earnings Ratio
- `peg_ratio` - Price/Earnings-to-Growth Ratio
- `debt_to_fcf` - Debt-to-Free Cash Flow Ratio
- `market_cap` - Market Capitalization
- `revenue_growth` - Revenue Growth Percentage

**Operators:**
- `<` - Less than
- `>` - Greater than
- `<=` - Less than or equal to
- `>=` - Greater than or equal to
- `=` - Equal to

## 🎨 Key Features Explained

### Enhanced Market Insights
- **P/E Ratio Analysis**: Average, minimum, and maximum across results
- **Market Capitalization**: Total and average market cap with formatted display
- **Sector Distribution**: Visual progress bars showing stock distribution by sector
- **Color-Coded Metrics**: Different colors for different metric types

### Smart Stock Cards
- Gradient backgrounds for visual appeal
- Key metrics displayed in organized grid
- Formatted market cap values (B for billions, M for millions)
- Sector tags for quick identification

### Server Health Monitoring
- Real-time connection status indicator
- Automatic health checks on app launch
- Visual feedback (green = online, red = offline)

## 🔧 Configuration

### Backend API Endpoint
Update the base URL in [api_service.dart](stock_screener_app/lib/services/api_service.dart):
```dart
static const String baseUrl = 'http://localhost:5000';
```

For production, use your deployed backend URL.

### Database Customization
Add more stocks by inserting into the database:
```sql
INSERT INTO companies (symbol, name, sector, exchange) VALUES
('SYMBOL', 'Company Name', 'Sector', 'Exchange');

INSERT INTO fundamentals (symbol, pe_ratio, peg_ratio, debt_to_fcf, revenue_growth, market_cap, eps) VALUES
('SYMBOL', 25.5, 2.1, 0.15, 12.5, 500000000000, 45.2);
```

## 📚 API Documentation

### POST `/screener`
Screen stocks using natural language query.

**Request:**
```json
{
  "query": "Show IT stocks with PE below 25"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "TCS",
      "name": "Tata Consultancy Services",
      "sector": "IT",
      "pe_ratio": 28.5,
      "peg_ratio": 2.1,
      "debt_to_fcf": 0.05,
      "market_cap": 1200000000000,
      "revenue_growth": 12.5
    }
  ]
}
```

### GET `/health`
Check backend server status.

**Response:**
```json
{
  "status": "OK"
}
```

## 🧪 Testing

Run backend tests:
```bash
cd backend
npm test
```

Test the API manually:
```bash
# Test health endpoint
curl http://localhost:5000/health

# Test screener endpoint
curl -X POST http://localhost:5000/screener \
  -H "Content-Type: application/json" \
  -d '{"query": "Show IT stocks with PE below 25"}'
```

## 🚀 Deployment

### Backend Deployment
Deploy to platforms like:
- Heroku
- Railway
- Render
- AWS EC2
- DigitalOcean

### Flutter App Deployment
Build for production:
```bash
# Android APK
flutter build apk --release

# iOS
flutter build ios --release

# Web
flutter build web --release
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Groq AI** for fast LLM inference
- **Flutter Team** for the amazing framework
- **PostgreSQL** for robust database management
- **Material Design 3** for beautiful UI components

## 📧 Support

For questions or issues, please open an issue on GitHub or contact the maintainers.

---

**Made with ❤️ using Flutter and Node.js**