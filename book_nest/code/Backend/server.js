require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');
const webSocketService = require('./services/WebSocketService');
const connectDB = require('./db/config');

process.on('uncaughtException', err => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    console.error(err.stack);
    process.exit(1);
});

// Set default environment variables if not set
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'your-super-secret-jwt-key-for-book-nest-app';
    console.log('Warning: Using default JWT_SECRET. Please set a proper secret in production.');
}

// Set JWT secret for WebSocket service
webSocketService.setJwtSecret(process.env.JWT_SECRET);

const startServer = async () => {
    const port = process.env.PORT || 5001;
    let server;

    // Try to connect to the database
    try {
        await connectDB();
    } catch (err) {
        console.error('Could not connect to database. Exiting...');
        process.exit(1);
    }

    if (process.env.NODE_ENV !== 'test') {
        // Check if port is in use
        const isPortAvailable = await new Promise(resolve => {
            const testServer = require('net').createServer()
                .once('error', () => resolve(false))
                .once('listening', () => {
                    testServer.close();
                    resolve(true);
                })
                .listen(port);
        });

        if (!isPortAvailable) {
            console.error(`Port ${port} is already in use. Please use a different port or stop the existing process.`);
            process.exit(1);
        }

        server = app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
        
        // Initialize WebSocket service
        webSocketService.initialize(server);
        console.log('WebSocket service initialized');

        // Handle server-specific errors
        server.on('error', (error) => {
            if (error.syscall !== 'listen') {
                throw error;
            }

            switch (error.code) {
                case 'EACCES':
                    console.error(`Port ${port} requires elevated privileges`);
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    console.error(`Port ${port} is already in use`);
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });
    }

    return server;
};

// Handle process events
process.on('unhandledRejection', err => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    console.error(err.stack);
    if (global.server) {
        global.server.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    if (global.server) {
        global.server.close(() => {
            console.log('💥 Process terminated!');
            mongoose.connection.close(false, () => {
                console.log('MongoDB connection closed.');
                process.exit(0);
            });
        });
    }
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
    startServer()
        .then(server => {
            global.server = server;
        })
        .catch(err => {
            console.error('Failed to start server:', err);
            process.exit(1);
        });
}

module.exports = { app, startServer }; 