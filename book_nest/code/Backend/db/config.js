// const mongoose = require("mongoose");
// // Middleware
// const MONGO_URI = 'mongodb+srv://elf:elf123@myprojects.inzgx1q.mongodb.net/BookStore?retryWrites=true&w=majority'
// // Connect to MongoDB using the connection string
// mongoose.connect(MONGO_URI, {
// //   useNewUrlParser: true,
// //   useUnifiedTopology: true,
// }).then(() => {
//   console.log(`Connection successful`);
// }).catch((e) => {
//   console.log(`No connection: ${e}`);
// });

// // mongodb://localhost:27017 

const mongoose = require('mongoose');
require('dotenv').config();

// Use MongoDB connection string from environment or fallback to Atlas URL
const getConnectionString = () => {
    if (process.env.NODE_ENV === 'test') {
        return global.__MONGO_URI__ || 'mongodb://localhost:27017/booknest_test';
    }
    
    const connectionString = process.env.DATABASE_URL || 'mongodb+srv://NamithaKallepalli:TUGW2hlEyioWBtaK@cluster0.lnsm3rf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    console.log('Using connection string:', connectionString);
    return connectionString;
};

const connectDB = async () => {
    try {
        // Configure mongoose settings
        mongoose.set('strictQuery', true);
        mongoose.set('debug', process.env.NODE_ENV === 'development');

        const DB = getConnectionString();
        console.log('Attempting to connect to MongoDB...');
        console.log('Environment:', process.env.NODE_ENV);
        
        const conn = await mongoose.connect(DB, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            dbName: 'booknest' // Explicitly setting the database name
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        if (error.name === 'MongoServerSelectionError') {
            console.error('Failed to connect to MongoDB server. Please check:');
            console.error('1. MongoDB Atlas credentials are correct');
            console.error('2. Your IP is whitelisted in MongoDB Atlas');
            console.error('3. MongoDB Atlas cluster is running');
        }
        throw error;
    }
};

// Handle MongoDB connection errors after initial connection
mongoose.connection.on('error', err => {
    console.error(`MongoDB connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Handle application termination
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});

module.exports = connectDB;
