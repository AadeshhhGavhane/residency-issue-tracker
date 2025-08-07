# 🏠 Residential Society Issue Tracker

A **comprehensive, fullstack issue tracking system** built for residential societies with role-based access control, real-time notifications, and advanced analytics. This system provides complete issue lifecycle management from reporting to resolution with automated assignment workflows.

## 🚀 Features

### **Core Issue Management**
- ✅ **Issue Reporting** with geotagging and media upload
- ✅ **Role-based Access Control** (Resident, Committee, Technician)
- ✅ **Assignment Workflow** with status tracking
- ✅ **Real-time Notifications** via email
- ✅ **Media Support** (images and videos)
- ✅ **Location Tracking** with coordinates and address
- ✅ **AI-Powered Priority Detection** (automatically determines priority based on content)
- ✅ **Image Verification** (n8n webhook validates images match issue description)
- ✅ **Priority Levels** (Low, Medium, High, Critical)
- ✅ **Custom Categories** with predefined options

### **User Roles & Permissions**
- ✅ **Residents**: Report issues, track progress, provide feedback
- ✅ **Committee Members**: Manage issues, assign technicians, view analytics, monitor performance
- ✅ **Technicians**: Accept assignments, update progress, complete tasks, track time

### **Assignment Management**
- ✅ **Assignment Creation** by committee members
- ✅ **Assignment Acceptance/Rejection** by technicians
- ✅ **Work Progress Tracking** (Start Work, Complete, Reject)
- ✅ **Time Tracking** and materials used
- ✅ **Quality Rating** and feedback system
- ✅ **Follow-up Management** for recurring issues

### **Advanced Analytics**
- ✅ **Performance Analytics** with resolution time metrics
- ✅ **Issue Category Distribution** charts
- ✅ **Status Distribution** tracking
- ✅ **Technician Performance** monitoring
- ✅ **Resolution Rate** calculations
- ✅ **Real-time Dashboard** updates

### **Advanced Features**
- ✅ **Analytics Dashboard** with charts and metrics
- ✅ **Email Notifications** for all major events
- ✅ **Audit Logging** for compliance
- ✅ **File Upload** with Cloudinary integration
- ✅ **Geospatial Data** for location tracking
- ✅ **Performance Metrics** and reporting
- ✅ **Multi-language Support** (English, Hindi)

### **Security & Compliance**
- ✅ **JWT Authentication** with role-based access
- ✅ **GDPR/CCPA Compliant** audit logging
- ✅ **Rate Limiting** protection
- ✅ **Input Validation** & sanitization
- ✅ **CORS** configuration
- ✅ **Security Headers** (Helmet)

### **Monitoring & Logging**
- ✅ **Cloud Logging** (Better Stack/Logtail)
- ✅ **Structured Logging** (Winston)
- ✅ **Audit Trail** (MongoDB)
- ✅ **API Documentation** (Swagger/OpenAPI)
- ✅ **Health Checks**
- ✅ **Performance Monitoring**

### **Frontend Features**
- ✅ **Responsive Design** (Bootstrap 5)
- ✅ **Real-time Validation**
- ✅ **Interactive Charts** (Chart.js)
- ✅ **Loading States** and progress indicators
- ✅ **Error Handling** with user feedback
- ✅ **File Upload Preview**
- ✅ **Role-based UI** (different views for different roles)

## 🛠️ Tech Stack

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **Logging**: Winston + Better Stack/Logtail
- **Validation**: Custom middleware
- **Documentation**: Swagger/OpenAPI
- **Geospatial**: MongoDB GeoJSON
- **Security**: bcrypt, helmet, rate-limiting

### **Frontend**
- **HTML5** + **CSS3** + **Vanilla JavaScript**
- **Bootstrap 5** for responsive design
- **Chart.js** for analytics visualization
- **No build process** required
- **Progressive Enhancement**

### **Security**
- **Password Hashing**: bcrypt
- **Token Management**: crypto module
- **Rate Limiting**: express-rate-limit
- **Security Headers**: helmet
- **Input Sanitization**: express-mongo-sanitize, xss-clean, hpp

## 📁 Project Structure

```
auth-starter-kit/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   ├── logger.js           # Winston logging setup
│   │   ├── swagger.js          # API documentation
│   │   └── validateEnv.js      # Environment validation
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── userController.js   # User profile management
│   │   ├── issueController.js  # Issue management
│   │   └── assignmentController.js # Assignment management
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   ├── errorHandler.js     # Error handling
│   │   ├── logging.js          # Request logging
│   │   ├── upload.js           # File upload (Multer + Cloudinary)
│   │   ├── validation.js       # Input validation
│   │   └── roleAuth.js         # Role-based access control
│   ├── models/
│   │   ├── User.js             # User schema with roles
│   │   ├── Issue.js            # Issue schema
│   │   ├── Assignment.js       # Assignment schema
│   │   ├── Feedback.js         # Feedback schema
│   │   └── AuditLog.js         # Audit logging schema
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── user.js             # User profile routes
│   │   ├── issues.js           # Issue management routes
│   │   └── assignments.js      # Assignment management routes
│   ├── services/
│   │   ├── auditService.js     # Audit logging service
│   │   └── emailService.js     # Email sending service
│   ├── utils/
│   │   └── tokenUtils.js       # Token generation utilities
│   ├── .env.example            # Environment variables template
│   ├── package.json            # Dependencies
│   └── server.js               # Express app entry point
├── frontend/
│   ├── css/
│   │   └── style.css           # Custom styles
│   ├── js/
│   │   ├── auth.js             # Frontend authentication logic
│   │   └── issues.js           # Issue management logic
│   ├── index.html              # Home page (protected)
│   ├── login.html              # Login page
│   ├── register.html           # Registration page
│   ├── profile.html            # User profile page
│   ├── report-issue.html       # Issue reporting page
│   ├── my-issues.html          # User's issues page
│   ├── admin-dashboard.html    # Committee dashboard
│   ├── technician-dashboard.html # Technician dashboard
│   ├── forgot-password.html    # Password reset request
│   ├── reset-password.html     # Password reset form
│   ├── verify-email.html       # Email verification
│   └── .gitignore              # Git ignore rules
├── README.md                   # Project documentation
└── .gitignore                  # Git ignore rules
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Cloudinary account (for file uploads)
- Email service (Gmail or SMTP)
- Better Stack/Logtail account (for cloud logging)

### **Backend Setup**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd auth-starter-kit
   ```

2. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

### **Frontend Setup**

1. **Serve the frontend**
   ```bash
   cd frontend
   # Use any static file server
   python -m http.server 3000
   # or
   npx serve .
   ```

2. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`
   - API Documentation: `http://localhost:5000/api-docs`

## 🔧 Configuration

### **Environment Variables**

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/residential_society_tracker

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=24h

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@issuesociety.com

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging Configuration
LOGTAIL_SOURCE_TOKEN=your-logtail-token
LOGTAIL_ENABLED=true
LOGTAIL_LEVEL=info
LOG_APPLICATION_LOGS=true
LOG_AUDIT_LOGS=true
LOG_SAMPLE_RATE=1.0
```

### **Database Setup**

The application will automatically create the necessary collections and indexes when it starts.

### **Email Setup**

For Gmail:
1. Enable 2-factor authentication
2. Generate an app password
3. Use the app password in EMAIL_PASSWORD

## 📊 User Roles & Workflows

### **Residents**
- **Register** with apartment details
- **Report issues** with location and media
- **Track issue progress** in real-time
- **Provide feedback** on resolution
- **View issue history** and status

### **Committee Members**
- **View all issues** and analytics dashboard
- **Assign issues** to technicians with time estimates
- **Monitor technician performance** and completion rates
- **Generate reports** and insights
- **Manage user accounts** and permissions

### **Technicians**
- **Accept/reject assignments** with reasons
- **Start work** on accepted assignments
- **Update progress** and add notes
- **Complete assignments** with time tracking
- **Track materials** used and costs
- **View assignment history** and performance

## 🔐 Security Features

- **JWT Authentication** with secure cookies
- **Role-based Access Control** (RBAC)
- **Input Validation** and sanitization
- **Rate Limiting** to prevent abuse
- **CORS Protection** for cross-origin requests
- **Security Headers** via Helmet
- **Audit Logging** for compliance
- **GDPR/CCPA Compliance** with data protection

## 📈 Analytics & Reporting

### **Performance Metrics**
- **Resolution Time** (average hours from assignment to resolution)
- **Resolution Rate** (percentage of resolved issues)
- **Issue Category Distribution** (pie chart)
- **Status Distribution** (bar chart)
- **Technician Performance** tracking

### **Dashboard Features**
- **Real-time updates** of metrics
- **Interactive charts** with Chart.js
- **Filterable data** by time period
- **Export capabilities** for reports
- **Mobile-responsive** design

## 🧪 Testing

```bash
# Backend tests (when implemented)
npm test

# API testing
# Use the Swagger documentation at /api-docs
```

## 📚 API Documentation

The API is fully documented with Swagger/OpenAPI. Access the interactive documentation at:
- **Development**: `http://localhost:5000/api-docs`
- **Production**: `https://your-domain.com/api-docs`

### **Key Endpoints**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/issues` - Create new issue
- `GET /api/issues` - Get user's issues
- `GET /api/issues/admin/all` - Get all issues (committee)
- `POST /api/assignments` - Create assignment
- `GET /api/assignments` - Get assignments
- `PUT /api/assignments/:id/accept` - Accept assignment
- `PUT /api/assignments/:id/start` - Start work
- `PUT /api/assignments/:id/complete` - Complete assignment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Check the API documentation
- Review the logs for errors
- Ensure all environment variables are set correctly
- Check the audit logs for compliance issues

## 🚀 Deployment

### **Backend Deployment**
1. Set up MongoDB Atlas or local MongoDB
2. Configure Cloudinary for file storage
3. Set up email service (Gmail/SMTP)
4. Configure Better Stack/Logtail for logging
5. Deploy to your preferred platform (Heroku, Vercel, etc.)

### **Frontend Deployment**
1. Serve static files from any web server
2. Configure CORS to allow your backend domain
3. Update API endpoints in frontend JavaScript

---

**Built with ❤️ for residential societies** 

*This system provides a complete solution for managing residential society issues with automated workflows, real-time tracking, and comprehensive analytics.* 