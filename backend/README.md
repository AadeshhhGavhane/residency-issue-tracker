# Auth Starter Kit Backend

A production-ready authentication API with comprehensive logging and monitoring.

## 🚀 Features

- **JWT Authentication** with HttpOnly cookies
- **User Management** with profile pictures
- **File Upload** to Cloudinary
- **Rate Limiting** and security middleware
- **Comprehensive Logging** with Winston
- **API Documentation** with Swagger
- **Environment Validation** on startup

## 📊 Logging Strategy

### Development
- **Console logs** - Colored, easy to read
- **File logs** - Limited to 3 files, 5MB each
- **Debug information** - Detailed request tracking

### Production
- **Console logs only** - stdout/stderr (industry standard)
- **No file logging** - Prevents disk I/O bottlenecks
- **Structured JSON** - Easy to parse by log aggregators

## 🏭 Industry Standard Deployment

### Recommended Log Aggregation Services:

1. **AWS CloudWatch** (AWS)
   ```bash
   # Logs automatically captured from stdout
   docker run -d your-app
   ```

2. **Datadog** (Comprehensive)
   ```bash
   # Install Datadog agent
   # Logs automatically captured
   ```

3. **Loggly** (Simple)
   ```bash
   # Environment variable
   LOGGLY_TOKEN=your-token
   ```

4. **Papertrail** (Real-time)
   ```bash
   # Remote logging
   PAPERTRAIL_URL=logs.papertrailapp.com:12345
   ```

### Docker Deployment
```dockerfile
# Logs go to stdout/stderr
CMD ["npm", "start"]
```

### Kubernetes Deployment
```yaml
# Logs automatically collected
spec:
  containers:
  - name: auth-api
    image: your-app
    # Logs go to stdout
```

## 🔧 Environment Variables

### Required
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

### Optional
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - CORS origin (default: http://localhost:3000)
- `LOG_LEVEL` - Logging level (default: info)

## 📈 Performance Benefits

### Before (File Logging)
- ❌ Disk I/O bottleneck
- ❌ Disk space consumption
- ❌ Memory usage from large files
- ❌ Server crashes from full disk

### After (stdout Logging)
- ✅ No disk I/O overhead
- ✅ Automatic log rotation
- ✅ Centralized monitoring
- ✅ Real-time alerting
- ✅ Easy log analysis

## 🚀 Quick Start

```bash
# Development
npm run dev

# Production
NODE_ENV=production npm start

# With Docker
docker run -d your-app
```

## 📚 API Documentation

Visit `http://localhost:5000/api-docs` for interactive API documentation.

## 🔍 Monitoring

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Log Monitoring
```bash
# View logs in real-time
docker logs -f your-container

# Or with log aggregation
# Logs automatically sent to your chosen service
```

## 🛡️ Security Features

- **Rate Limiting** - Prevents abuse
- **Input Sanitization** - XSS protection
- **MongoDB Injection Protection**
- **HTTP Parameter Pollution Protection**
- **Security Headers** (Helmet)
- **CORS Protection**

## 📝 Log Levels

- **ERROR** - System errors (5xx responses)
- **WARN** - Application warnings
- **INFO** - Business events (login, register)
- **DEBUG** - Development details

## 🎯 Best Practices

1. **Never log to files in production**
2. **Use structured logging (JSON)**
3. **Log to stdout/stderr only**
4. **Use log aggregation services**
5. **Monitor log volume and performance**
6. **Set up alerts for errors**
7. **Regular log analysis**

## 🔄 Migration Guide

### From File Logging to stdout:

1. **Update environment:**
   ```bash
   NODE_ENV=production
   ```

2. **Deploy with log aggregation:**
   ```bash
   # AWS CloudWatch
   docker run -d your-app
   
   # Or with custom log driver
   docker run -d --log-driver=awslogs your-app
   ```

3. **Monitor logs:**
   ```bash
   # View real-time logs
   docker logs -f your-container
   ```

## 📊 Performance Metrics

- **Response Time** - Tracked for all requests
- **Error Rate** - 4xx/5xx responses
- **Authentication Events** - Login/logout tracking
- **File Uploads** - Profile picture uploads
- **Rate Limiting** - Abuse prevention metrics

This setup follows industry standards and scales with your application! 