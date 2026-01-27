# Authentication API Documentation

## Overview
Complete user authentication system with signup, login, and JWT-based authorization.

## Database
- **Table**: `users`
- **Columns**:
  - `id`: Serial primary key
  - `email`: Unique email address
  - `password_hash`: Bcrypt hashed password
  - `name`: User's display name
  - `created_at`: Account creation timestamp
  - `updated_at`: Last profile update
  - `is_active`: Account status
  - `last_login`: Last login timestamp

## Endpoints

### 1. Signup
**POST** `/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Validation:**
- Email: Required, valid format
- Password: Required, minimum 6 characters
- Name: Required

**Success Response (201):**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2026-01-26T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Missing or invalid fields
- `409`: Email already exists
- `500`: Server error

**Example (PowerShell):**
```powershell
$body = @{
    email = "user@example.com"
    password = "password123"
    name = "John Doe"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/auth/signup" -Method POST -Body $body -ContentType "application/json"
```

---

### 2. Login
**POST** `/auth/login`

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses:**
- `400`: Missing email or password
- `401`: Invalid credentials
- `403`: Account deactivated
- `500`: Server error

**Example (PowerShell):**
```powershell
$body = @{
    email = "user@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $response.token
```

---

### 3. Get User Profile (Protected)
**GET** `/user/profile`

Get current user's profile. Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "userId": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses:**
- `401`: Missing or expired token
- `403`: Invalid token

**Example (PowerShell):**
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/user/profile" -Method GET -Headers $headers
```

---

## JWT Token Details

**Token Lifetime:** 7 days

**Token Payload:**
```json
{
  "userId": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "iat": 1706265600,
  "exp": 1706870400
}
```

**Token Usage:**
Include in Authorization header for all protected routes:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Security Features

1. **Password Hashing**: Bcrypt with 10 salt rounds
2. **Email Validation**: Regex pattern matching
3. **Token Expiration**: 7-day validity
4. **Case-Insensitive Email**: Stored in lowercase
5. **Account Status**: Can deactivate accounts
6. **Last Login Tracking**: Updates on each login

---

## Testing

Run the test script:
```powershell
cd backend
.\test-auth.ps1
```

The script tests:
- User signup
- User login
- Protected route access
- Invalid token rejection

---

## Integration with Frontend

### 1. Signup Flow
```javascript
// Flutter/Dart example
final response = await http.post(
  Uri.parse('http://localhost:5000/auth/signup'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'email': email,
    'password': password,
    'name': name,
  }),
);

if (response.statusCode == 201) {
  final data = jsonDecode(response.body);
  final token = data['token'];
  // Save token securely (e.g., SharedPreferences)
}
```

### 2. Login Flow
```javascript
final response = await http.post(
  Uri.parse('http://localhost:5000/auth/login'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'email': email,
    'password': password,
  }),
);

if (response.statusCode == 200) {
  final data = jsonDecode(response.body);
  final token = data['token'];
  // Save token
}
```

### 3. Protected API Calls
```javascript
final response = await http.get(
  Uri.parse('http://localhost:5000/user/profile'),
  headers: {
    'Authorization': 'Bearer $token',
  },
);
```

---

## Protecting Routes

To protect any route, add the auth middleware:

```javascript
const authMiddleware = require("../middleware/authMiddleware");

router.get("/protected-endpoint", authMiddleware, (req, res) => {
  // Access user info from req.user
  const userId = req.user.userId;
  const email = req.user.email;
  
  res.json({ message: "Protected data", userId });
});
```

---

## Environment Variables

Required in `.env`:
```env
JWT_SECRET=your_secret_key_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stock_screener
DB_USER=postgres
DB_PASSWORD=your_password
```

---

## Common Errors

### "Authorization header missing"
- Solution: Include `Authorization: Bearer <token>` header

### "Token expired"
- Solution: User must login again to get new token

### "Invalid token"
- Solution: Token is malformed or signature invalid

### "Email already exists"
- Solution: User should login instead of signup

---

## Next Steps

1. Add password reset functionality
2. Add email verification
3. Implement refresh tokens
4. Add OAuth (Google, GitHub)
5. Add rate limiting
6. Add account deletion
7. Add profile update endpoint

---

## Created: January 26, 2026
## Status: Production Ready ✅
