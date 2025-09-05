# MongoDB Atlas Setup Guide

## 🚀 Quick Setup Steps

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new project called "Design Center"

### 2. Create a Cluster
1. Click "Build a Database"
2. Choose "M0 Sandbox" (Free tier)
3. Select your preferred cloud provider and region
4. Click "Create Cluster"

### 3. Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Set username: `designcenter-user`
4. Set password: Generate a secure password
5. Set privileges: "Read and write to any database"
6. Click "Add User"

### 4. Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add your specific IP addresses
5. Click "Confirm"

### 5. Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "4.1 or later"
5. Copy the connection string

### 6. Update Your Application

#### Create .env file in backend directory:
```bash
cd backend
cp .env.example .env
```

#### Edit .env file with your Atlas connection string:
```env
MONGODB_URI=mongodb+srv://designcenter-user:<password>@cluster0.xxxxx.mongodb.net/designcenter?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
PORT=4000
NODE_ENV=development
```

### 7. Migrate Your Data (Optional)

If you have existing data in your local MongoDB:

```bash
# Run the migration script
cd backend
node scripts/migrateToAtlas.js
```

### 8. Test the Connection

```bash
# Start your backend
npm start

# Check if it connects successfully
# You should see: "✅ MongoDB connected successfully"
```

## 🔧 Troubleshooting

### Connection Issues
- **Authentication failed**: Check username/password in connection string
- **Network access denied**: Add your IP to Network Access list
- **SSL/TLS errors**: Ensure connection string includes `?retryWrites=true&w=majority`

### Data Migration Issues
- **Import fails**: Check if data export was successful
- **Duplicate data**: The script clears existing data before import
- **Large datasets**: Consider using MongoDB Compass for large migrations

## 📊 Monitoring

### Atlas Dashboard
- Monitor your cluster performance
- Check connection metrics
- View database usage

### Application Logs
- Check for connection success messages
- Monitor query performance
- Watch for timeout errors

## 🚀 Production Considerations

### Security
- Use specific IP addresses instead of 0.0.0.0/0
- Rotate database passwords regularly
- Enable MongoDB Atlas encryption at rest

### Performance
- Upgrade to paid tiers for better performance
- Use connection pooling
- Monitor query performance

### Backup
- Enable automated backups
- Test restore procedures
- Document backup schedules

## 📝 Environment Variables

Required environment variables for production:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
PORT=4000
```

## 🔄 Switching Between Local and Atlas

To switch between local MongoDB and Atlas:

### Use Local MongoDB:
```env
MONGODB_URI=mongodb://localhost:27017/designcenter
```

### Use MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/designcenter
```

## 📞 Support

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Community Forums](https://community.mongodb.com/)
- [MongoDB University](https://university.mongodb.com/)
