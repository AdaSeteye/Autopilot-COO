# 🚀 AutoPilot COO - Production Deployment Checklist

This checklist ensures your AutoPilot COO application is properly configured and secured for production use.

## ✅ Pre-Deployment Checklist

### 🔧 Infrastructure Requirements
- [ ] **Server**: Linux server with at least 2GB RAM and 20GB storage
- [ ] **Node.js**: Version 18.0 or higher installed
- [ ] **MySQL**: Version 8.0 or higher installed and configured
- [ ] **Domain**: DNS configured for your application domains
- [ ] **SSL Certificate**: Valid SSL certificates for HTTPS (recommended: Let's Encrypt)
- [ ] **Firewall**: Proper firewall rules configured (ports 80, 443, and custom ports as needed)

### 🔐 Security Configuration
- [ ] **JWT Secret**: Strong, randomly generated JWT secret (64+ characters)
- [ ] **Database Credentials**: Secure database username and password
- [ ] **Environment Variables**: All sensitive data in environment variables, not code
- [ ] **HTTPS**: SSL/TLS certificates configured
- [ ] **Rate Limiting**: API rate limiting enabled and properly configured
- [ ] **CORS**: Proper CORS configuration for your domains
- [ ] **Input Validation**: All user inputs validated and sanitized

### 📊 Database Setup
- [ ] **Database Created**: MySQL database created with proper charset (utf8mb4)
- [ ] **User Permissions**: Database user with minimal required permissions
- [ ] **Backups**: Automated database backup system configured
- [ ] **Connection Pooling**: Database connection pooling configured
- [ ] **Indexes**: All necessary database indexes created for performance

### 🌐 Application Configuration
- [ ] **Environment Files**: All environment variables properly set
- [ ] **Build Process**: Applications built for production (`npm run build`)
- [ ] **Log Directory**: Logging directory created with proper permissions
- [ ] **Process Management**: PM2, systemd, or similar process manager configured
- [ ] **Health Checks**: Application health endpoints accessible

## 🚀 Deployment Process

### 1. Quick Setup (Recommended)
```bash
# Run the automated setup script
chmod +x setup.sh
./setup.sh
```

### 2. Manual Setup
If you prefer manual setup, follow these steps:

#### Backend Configuration
```bash
cd backend
cp .env.example .env
# Edit .env with your production values
npm install --production
```

#### Frontend Configuration
```bash
cp .env.example .env.local
# Edit .env.local with your production values
npm install --production
npm run build
```

#### Database Initialization
```bash
# The database tables will be created automatically on first run
# Or run manually if needed
mysql -u your_user -p your_database < database/schema.sql
```

### 3. Start Services
```bash
# Using the provided scripts
./start.sh

# Or using systemd (if configured)
sudo systemctl start autopilot-coo-backend
sudo systemctl start autopilot-coo-frontend

# Or using PM2
pm2 start ecosystem.config.js
```

## 🔍 Post-Deployment Verification

### Health Checks
- [ ] **Backend Health**: `curl http://your-backend-url/health` returns 200 OK
- [ ] **Frontend Loading**: Frontend loads without errors
- [ ] **Database Connection**: Application connects to database successfully
- [ ] **API Endpoints**: Critical API endpoints respond correctly
- [ ] **Authentication**: User registration and login work correctly

### Performance Tests
- [ ] **Response Times**: API response times under 500ms for critical endpoints
- [ ] **Concurrent Users**: Application handles expected concurrent load
- [ ] **Memory Usage**: Memory usage stable and within server limits
- [ ] **CPU Usage**: CPU usage reasonable under normal load

### Security Verification
- [ ] **HTTPS**: All traffic encrypted with valid SSL certificates
- [ ] **Headers**: Security headers present (run security header scan)
- [ ] **Vulnerabilities**: No known vulnerabilities (`npm audit`)
- [ ] **Database Access**: Database not directly accessible from internet
- [ ] **Error Handling**: No sensitive information leaked in error messages

## 📊 Monitoring Setup

### Application Monitoring
- [ ] **Uptime Monitoring**: Service like UptimeRobot or Pingdom configured
- [ ] **Performance Monitoring**: APM tool configured (optional)
- [ ] **Error Tracking**: Error tracking service configured (optional)
- [ ] **Log Aggregation**: Centralized logging system (optional)

### Infrastructure Monitoring
- [ ] **Server Resources**: CPU, memory, disk space monitoring
- [ ] **Database Performance**: Database query performance monitoring
- [ ] **Network Monitoring**: Network connectivity and bandwidth monitoring
- [ ] **Backup Verification**: Regular backup testing and verification

## 🔧 Maintenance Tasks

### Daily
- [ ] Check application logs for errors
- [ ] Verify all services are running
- [ ] Monitor resource usage

### Weekly
- [ ] Review performance metrics
- [ ] Check for security updates
- [ ] Verify backup integrity

### Monthly
- [ ] Update dependencies (after testing)
- [ ] Review and rotate logs
- [ ] Security audit and penetration testing
- [ ] Performance optimization review

## 🆘 Troubleshooting

### Common Issues

#### Application Won't Start
1. Check environment variables are set correctly
2. Verify database connection
3. Check port availability
4. Review application logs

#### Database Connection Issues
1. Verify database credentials
2. Check database server status
3. Confirm network connectivity
4. Review database user permissions

#### Performance Issues
1. Check server resources (CPU, memory)
2. Review database query performance
3. Analyze application logs
4. Monitor network connectivity

#### SSL/HTTPS Issues
1. Verify certificate validity
2. Check certificate chain
3. Confirm SSL configuration
4. Test with SSL Labs scanner

### Log Locations
- **Frontend Logs**: `logs/frontend.log`
- **Backend Logs**: `logs/backend.log`
- **Database Logs**: `/var/log/mysql/` (default)
- **System Logs**: `/var/log/syslog`

### Support Commands
```bash
# Check service status
sudo systemctl status autopilot-coo-backend
sudo systemctl status autopilot-coo-frontend

# View recent logs
tail -f logs/backend.log
tail -f logs/frontend.log

# Check database connection
mysql -u username -p database_name -e "SELECT 1;"

# Test API health
curl -I http://localhost:3001/health
```

## 📞 Support

- **Documentation**: README.md
- **Issues**: Create a GitHub issue
- **Email**: support@autopilotcoo.com

## 🎉 Success!

Once all items in this checklist are complete, your AutoPilot COO application should be:
- ✅ Securely deployed and accessible
- ✅ Properly monitored and maintained
- ✅ Ready for production use
- ✅ Scalable for growth

**Congratulations on successfully deploying AutoPilot COO! 🚀**