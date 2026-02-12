# Stock Surya - AI-Powered Mobile Stock Screener

## Features

- **Stock Screening**: Advanced stock analysis and screening
- **AI Chat**: Intelligent stock recommendations and insights
- **News Integration**: Real-time financial news from India and worldwide
- **Email Alerts**: Daily and weekly stock news alerts via email
- **User Authentication**: Secure login/signup with Supabase

## Email Alert System

### Setup

1. **Configure Email Settings**:
   - Update `.env` file with your Gmail credentials:

   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_APP_PASSWORD=your-app-specific-password
   ```

   - Get app password from Google Account settings (Security > App passwords)

2. **Database Setup**:
   - Run the authentication schema: `database/authentication.psql`
   - This creates the `user_alert_preferences` table

### Alert Types

- **Alert Activation**: When users enable alerts, they receive a confirmation email
- **Daily Alerts**: Top 5 news articles sent daily to users with daily alerts enabled
- **Weekly Digest**: Comprehensive weekly news summary sent every Sunday

### API Endpoints

- `POST /api/alerts/preferences` - Update user alert preferences
- `GET /api/alerts/preferences/:userId` - Get user alert preferences
- `POST /api/alerts/send-daily` - Send daily alerts (cron job)
- `POST /api/alerts/send-weekly` - Send weekly digest (cron job)

### Usage

Users can toggle alerts in the News section. When enabled:

1. Alert preferences are saved to database
2. Confirmation email is sent immediately
3. Daily emails are sent automatically
4. Weekly digest is sent on schedule

## Installation

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the development server

   ```bash
   npm run start
   ```

3. Start the backend API server

   ```bash
   node script/server.js
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GROQ_API_KEY=your-groq-api-key
EXPO_PUBLIC_NEWS_API=your-news-api-key
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-specific-password
```

## Project Structure

```
app/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── auth/              # Authentication screens
└── _layout.tsx        # Root layout

script/
├── server.js          # Backend API server
├── middleware/        # Server middleware
└── llmservicess/     # LLM integration

database/
└── authentication.psql  # Database schema
```

## Development

- **Frontend**: React Native with Expo
- **Backend**: Node.js with Express
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Email**: Nodemailer with Gmail
- **News API**: SerpApi integration

## Authentication (Clerk)

This project uses Clerk for authentication with email/password on React Native.

- Add your Clerk publishable key to a `.env` file:

  ```bash
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_XXXX
  ```

- Install dependencies:

  ```bash
  npm install @clerk/clerk-expo
  npx expo install expo-secure-store
  ```

- Start the app and navigate to `auth/login` to sign in or `auth/register` to create an account.
