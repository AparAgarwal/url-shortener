# URL Shortener

A modern, secure URL shortening service built with Node.js, Express, and MongoDB. Features include user authentication, click analytics, input validation, and a clean web interface with RESTful API support.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Endpoints](#-api-endpoints)
- [Security Features](#-security-features)
- [Development](#-development)
- [Testing the Application](#-testing-the-application)
- [Recommended Development Tools](#recommended-development-tools)
- [Project Notes](#-project-notes)
- [Contributing](#-contributing)
- [Author](#-author)

## ✨ Features

- **URL Shortening**: Convert long URLs into short, manageable links with automatic protocol detection
- **Click Analytics**: Track click counts and last clicked timestamps for each URL
- **User Authentication**: Secure signup and login with JWT-based authentication and bcrypt password hashing
- **Profile Management**: User profile page with avatar upload and management capabilities
- **URL Management**: View, copy, and delete shortened URLs through an intuitive dashboard
- **File Upload**: Image upload support with Cloudinary integration for avatar management
- **Input Validation**: Comprehensive validation and sanitization using express-validator
- **Security**: JWT authentication, NoSQL injection prevention, XSS protection, and password security
- **Responsive UI**: Clean, modern web interface built with EJS templates
- **Error Handling**: Centralized error handling with detailed logging
- **RESTful API**: Well-structured API with content negotiation (JSON/HTML)
- **Environment Validation**: Startup validation ensures all required configurations are present
- **Database Resilience**: Connection retry logic with graceful degradation

## 🛠 Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js v5
- **Database**: MongoDB with Mongoose ODM
- **Template Engine**: EJS
- **Authentication**: JWT (jsonwebtoken) + bcrypt (salt rounds: 12)
- **Validation**: express-validator
- **File Upload**: Multer + Cloudinary
- **ID Generation**: nanoid (8-character IDs)
- **Environment**: dotenv
- **Middleware**: cookie-parser, express.json, express.urlencoded, multer, JWT auth
- **Code Quality**: ESLint 9 + Prettier
- **Static Assets**: serve-favicon

## 📁 Project Structure

```
urlShortener/
├── app.js                    # Express app configuration
├── index.js                  # Server entry point
├── constants.js              # Application constants and configurations
├── package.json              # Project dependencies
├── eslint.config.js          # ESLint configuration (flat config)
├── .prettierrc.json          # Prettier configuration
├── .env.sample               # Environment variables template
├── config/
│   └── db.js                # Database connection with retry logic
├── controllers/
│   ├── url.controller.js    # URL business logic (create, redirect, delete, analytics)
│   └── user.controller.js   # User business logic (signup, login, profile)
├── middlewares/
│   ├── auth.middleware.js   # JWT authentication middleware
│   ├── errorHandler.js      # Global error handling middleware
│   ├── multer.middleware.js # File upload middleware configuration
│   └── validators.js        # Input validation and sanitization rules
├── models/
│   ├── url.model.js         # URL schema with click analytics
│   └── user.model.js        # User schema with secure password handling
├── routes/
│   ├── static.routes.js     # Static pages and web form routes
│   ├── url.routes.js        # URL API routes
│   └── user.routes.js       # User API routes
├── utils/
│   ├── ApiError.js          # Custom error class
│   ├── ApiResponse.js       # Standardized API response
│   ├── asyncHandler.js      # Async error wrapper
│   ├── cloudinary.js        # Cloudinary configuration and upload utilities
│   ├── generateAvatars.js   # Avatar generation utilities
│   ├── helpers.js           # General helper functions
│   └── validateEnv.js       # Environment variable validation
├── service/                  # Business logic services (empty for now)
├── views/                    # EJS templates
│   ├── home.ejs             # Homepage with URL creation form
│   ├── login.ejs            # Login page
│   ├── logout.ejs           # Logout confirmation page
│   ├── signup.ejs           # Signup page
│   ├── profile.ejs          # User profile page with avatar
│   └── manage-urls.ejs      # URL management dashboard
└── public/                   # Static assets
    ├── auth.css             # Authentication page styles
    ├── manage.css           # Dashboard styles
    ├── profile.css          # Profile page styles
    ├── styles.css           # Homepage styles
    ├── favicon.ico          # Site favicon
    └── temp/                # Temporary file storage for uploads
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** (v5.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
    - You can use MongoDB Atlas (cloud) or local installation

## 🚀 Installation

1. **Clone the repository**:

    ```bash
    git clone <repository-url>
    cd urlShortener
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```

## ⚙️ Configuration

1. **Create environment file**:
    - Copy the `.env.sample` file to `.env`:
        ```bash
        cp .env.sample .env
        ```
        Or on Windows:
        ```powershell
        copy .env.sample .env
        ```

2. **Configure environment variables** in `.env`:

    ```env
    PORT=3000
    MONGO_URI="mongodb://localhost:27017/shorturl"
    NODE_ENV="development"
    BASE_URL="http://localhost:3000"
    ```

    **Environment Variables Explained**:
    - `PORT`: Port number where the server will run (default: 3000)
    - `MONGO_URI`: MongoDB connection string
        - For local MongoDB: `mongodb://localhost:27017/shorturl`
        - For MongoDB Atlas: `mongodb+srv://<username>:<password>@cluster.mongodb.net/shorturl`
    - `NODE_ENV`: Environment mode (`development` or `production`)
    - `BASE_URL`: Base URL for generating short links
    - `JWT_SECRET`: Secret key for JWT token generation and verification
    - `JWT_EXPIRY`: JWT token expiration time (e.g., "7d", "24h")
    - `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name for image uploads
    - `CLOUDINARY_API_KEY`: Cloudinary API key
    - `CLOUDINARY_API_SECRET`: Cloudinary API secret

3. **Start MongoDB** (if using local installation):

    ```bash
    # Windows
    net start MongoDB

    # macOS/Linux
    sudo systemctl start mongod
    ```

## 🏃 Running the Application

### Development Mode (with auto-restart)

```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

### Production Mode

```bash
npm start
```

### Code Quality Commands

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check
```

The server will start at `http://localhost:3000` (or the port specified in your `.env` file).

You should see:

```
✓ Environment variables validated successfully
Server running at http://localhost:3000
✓ MongoDB connected successfully!
  Host: localhost
  Database: shorturl
```

## 🔌 API Endpoints

### Web Routes (HTML Responses)

#### View Pages

- `GET /` - Home page with URL creation form
- `GET /signup` - User signup page
- `GET /login` - User login page
- `GET /logout` - Logout confirmation page
- `GET /profile` - User profile page (requires authentication)
- `GET /manage-urls` - URL management dashboard (requires authentication)
- `GET /:shortId` - Redirect to original URL (with click tracking)

#### Web Form Submissions

- `POST /url` - Create short URL via web form (returns HTML)
    - Body: `{ redirectUrl: string }`
- `POST /user/register` - Register via web form (returns HTML)
    - Body: `{ fullName, username, email, password }`
- `POST /user/login` - Login via web form (returns HTML)
    - Body: `{ identifier, password }`

### API Routes (JSON Responses)

#### URL Management (`/api/v1/url`)

**Create Short URL**

```http
POST /api/v1/url
Content-Type: application/json

{
  "redirectUrl": "https://example.com/very-long-url"
}

Response: 201 Created
{
  "statusCode": 201,
  "success": true,
  "message": "Short URL created successfully",
  "data": {
    "shortId": "abc123XY",
    "redirectUrl": "https://example.com/very-long-url"
  }
}
```

**Get All URLs**

```http
GET /api/v1/url

Response: 200 OK
{
  "statusCode": 200,
  "success": true,
  "message": "URLs fetched successfully",
  "data": [
    {
      "_id": "...",
      "shortId": "abc123XY",
      "redirectUrl": "https://example.com",
      "clickCount": 42,
      "lastClickedAt": "2025-12-21T10:30:00.000Z",
      "createdAt": "2025-12-20T15:00:00.000Z",
      "updatedAt": "2025-12-21T10:30:00.000Z"
    }
  ]
}
```

**Delete URL**

```http
DELETE /api/v1/url/:shortId

Response: 200 OK
{
  "statusCode": 200,
  "success": true,
  "message": "URL deleted successfully",
  "data": { ... }
}
```

#### User Management (`/api/v1/user`)

**Register User**

```http
POST /api/v1/user/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response: 201 Created
{
  "statusCode": 201,
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "...",
    "fullName": "John Doe",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

**Login User**

```http
POST /api/v1/user/login
Content-Type: application/json

{
  "identifier": "johndoe",  // or "john@example.com"
  "password": "SecurePass123"
}

Response: 200 OK
{
  "statusCode": 200,
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "...",
    "fullName": "John Doe",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

### Error Responses

All errors follow this format:

```json
{
    "success": false,
    "message": "Error description",
    "errors": []
}
```

## 🔒 Security Features

### Input Validation & Sanitization

- **URL Validation**: Format checking, length limits, protocol validation
- **User Input**: Length constraints, pattern matching, character whitelisting
- **NoSQL Injection Prevention**: Removes MongoDB operators (`$`), converts objects to strings
- **XSS Protection**: HTML entity escaping on user inputs

### Authentication & Password Security

- **JWT Tokens**: Stateless authentication using JSON Web Tokens
- **Token Storage**: Secure HTTP-only cookies for token storage
- **Token Expiration**: Configurable expiration time for security
- **Hashing**: bcrypt with 12 salt rounds
- **Storage**: Passwords never stored in plain text
- **Database**: Password field excluded from queries by default (`select: false`)
- **API Responses**: Passwords never returned in API responses
- **Requirements**: Minimum 8 characters, must include uppercase, lowercase, and digit
- **Protected Routes**: Middleware-based route protection using JWT verification

### Validation Rules

- **Full Name**: 2-100 characters, letters and spaces only
- **Username**: 3-30 characters, alphanumeric and underscores, unique
- **Email**: Valid email format, normalized, unique
- **Password**: 8-128 characters, complexity requirements
- **URL**: Valid format, max 2048 characters, auto-protocol addition
- **Short ID**: 8 characters, alphanumeric with hyphens/underscores

### Database Security

- **Connection**: Retry logic with graceful failure
- **Environment Validation**: Required variables checked at startup
- **Indexes**: Optimized queries on frequently accessed fields
- **Atomic Operations**: Click counting uses atomic increment

## 🧪 Development

### Code Quality Tools

This project uses:

- **ESLint 9**: Linting with flat config format
- **Prettier**: Code formatting
- **express-validator**: Input validation and sanitization

### Validation Middleware

All routes use validation middleware:

```javascript
// URL validation
createUrlValidation; // Validates and sanitizes URL input

// User validation
signupValidation; // Validates signup fields
loginValidation; // Validates login credentials

// Parameter validation
shortIdValidation; // Validates short ID format
```

### Authentication Middleware

Protected routes use JWT authentication:

```javascript
// Verifies JWT token from cookies
// Attaches user data to request object
// Protects routes like /profile and /manage-urls
verifyJWT; // JWT authentication middleware
```

### File Upload Middleware

Profile avatar uploads handled by Multer:

```javascript
// Multer configuration for file uploads
// Temporary local storage before Cloudinary upload
// File type and size validation
upload.single('avatar'); // Multer middleware for single file upload
```

### Content Negotiation

Controllers automatically detect request type and respond accordingly:

```javascript
// Detects if request wants JSON or HTML
const isApiRequest = (req) =>
  req.xhr || // AJAX request
  req.headers.accept?.includes('application/json') || // Wants JSON
  req.originalUrl.startsWith('/api/'); // API route

// Returns appropriate response
if (isApiRequest(req)) {
  return res.json({ ... });  // API response
}
return res.render('view');   // Web response
```

## 🧪 Testing the Application

### Using the Web Interface

1. Open your browser and navigate to `http://localhost:3000`
2. Sign up for a new account (requires valid email format)
3. Login with your credentials
4. Create a shortened URL
5. Test the redirect functionality by visiting the short URL
6. View analytics in the management dashboard

### Using API (with curl)

**Create a short URL:**

```bash
curl -X POST http://localhost:3000/api/v1/url \
  -H "Content-Type: application/json" \
  -d '{"redirectUrl": "https://example.com"}'
```

**Register a user:**

```bash
curl -X POST http://localhost:3000/api/v1/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Get all URLs:**

```bash
curl http://localhost:3000/api/v1/url
```

## Recommended Development Tools

- **Code Editor**: Visual Studio Code
- **API Testing**: Postman, Thunder Client (VS Code extension), or REST Client
- **MongoDB GUI**: MongoDB Compass
- **VS Code Extensions**:
    - ESLint
    - Prettier
    - MongoDB for VS Code
    - REST Client

## 📝 Project Notes

- Uses ES6 modules (`"type": "module"` in package.json)
- JWT-based authentication with HTTP-only cookies
- Passwords hashed with bcrypt (12 salt rounds)
- Short IDs generated with nanoid (8 characters)
- File uploads handled by Multer with Cloudinary storage
- Centralized error handling
- Content negotiation for API/Web responses
- Click analytics tracked atomically
- Environment variables validated at startup
- Protected routes using JWT verification middleware
- Avatar images stored on Cloudinary CDN

## 🤝 Contributing

This is a learning project. Feel free to fork and experiment!

## 👨‍💻 Author

**Apar Agarwal**
