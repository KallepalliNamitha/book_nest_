const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

class WebSocketService {
    constructor() {
        this.clients = new Map(); // userId -> WebSocket
        this.wss = null;
        this.heartbeatInterval = null;
        this.reconnectAttempts = new Map(); // userId -> number of attempts
    }

    setJwtSecret(secret) {
        if (!secret) {
            throw new Error('JWT_SECRET must be provided');
        }
        this.jwtSecret = secret;
    }

    initialize(server) {
        if (!this.jwtSecret) {
            throw new Error('JWT_SECRET must be set before initializing');
        }

        if (this.wss) {
            console.log('WebSocket server already initialized');
            return;
        }

        this.wss = new WebSocket.Server({
            server,
            path: '/api/ws',
            maxPayload: 512 * 1024, // 512KB max message size
            clientTracking: true,
            maxConnections: 1000, // Limit total connections
            verifyClient: async (info, callback) => {
                try {
                    const token = new URL(info.req.url, 'ws://localhost').searchParams.get('token');
                    if (!token) {
                        callback(false, 401, 'Unauthorized: No token provided');
                        return;
                    }

                    const decoded = jwt.verify(token, this.jwtSecret);
                    if (!decoded || !decoded.userId) {
                        callback(false, 401, 'Unauthorized: Invalid token format');
                        return;
                    }

                    const user = await User.findById(decoded.userId).select('+active');
                    if (!user || !user.active) {
                        callback(false, 401, 'Unauthorized: User not found or inactive');
                        return;
                    }

                    // Store user data for later use
                    info.req.user = user;
                    callback(true);
                } catch (error) {
                    if (error instanceof jwt.JsonWebTokenError) {
                        callback(false, 401, 'Unauthorized: Invalid token');
                    } else {
                        callback(false, 500, 'Internal server error');
                    }
                }
            }
        });

        // Setup heartbeat interval with longer timeout
        this.heartbeatInterval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    const userId = ws.userId;
                    if (userId) {
                        this.reconnectAttempts.set(userId, (this.reconnectAttempts.get(userId) || 0) + 1);
                    }
                    return ws.terminate();
                }
                ws.isAlive = false; // Mark as not alive until pong is received
                ws.ping();
            });
        }, 45000); // Increased from 30s to 45s

        this.wss.on('connection', async (ws, req) => {
            try {
                ws.isAlive = true;
                ws.on('pong', () => {
                    ws.isAlive = true;
                });

                const user = req.user;
                const userId = user._id.toString();

                // Reset reconnection attempts on successful connection
                this.reconnectAttempts.delete(userId);

                // Remove any existing connection for this user
                const existingConnection = this.clients.get(userId);
                if (existingConnection && existingConnection !== ws) {
                    existingConnection.terminate();
                    this.clients.delete(userId);
                }

                // Store client connection
                this.clients.set(userId, ws);
                ws.userId = userId;

                // Handle client messages
                ws.on('message', (message) => {
                    try {
                        const data = JSON.parse(message);
                        this.handleMessage(userId, data);
                    } catch (error) {
                        // Silent error handling
                    }
                });

                // Handle client disconnection
                ws.on('close', () => {
                    this.clients.delete(userId);
                });

                // Handle errors
                ws.on('error', () => {
                    this.clients.delete(userId);
                });

                // Send welcome message
                ws.send(JSON.stringify({
                    type: 'connection',
                    message: 'Connected to BookNest notifications'
                }));

            } catch (error) {
                ws.terminate();
            }
        });

        // Handle server errors silently
        this.wss.on('error', () => {});

        // Clean up on server close
        this.wss.on('close', () => {
            this.cleanup();
        });

        // Cleanup on process termination
        process.on('SIGTERM', () => this.cleanup());
        process.on('SIGINT', () => this.cleanup());
    }

    cleanup() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.wss) {
            this.wss.clients.forEach((ws) => {
                try {
                    ws.terminate();
                } catch (error) {
                    // Silent cleanup
                }
            });
            this.wss.close();
            this.wss = null;
        }

        this.clients.clear();
        this.reconnectAttempts.clear();
    }

    // Send notification to specific user
    sendToUser(userId, notification) {
        const ws = this.clients.get(userId.toString());
        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify(notification));
            } catch (error) {
                console.debug('Error sending notification to user:', error);
                this.clients.delete(userId.toString());
            }
        }
    }

    // Send notification to all users with a specific role
    async sendToRole(role, notification) {
        const promises = [];
        this.clients.forEach((ws, userId) => {
            if (ws.readyState === WebSocket.OPEN) {
                promises.push(
                    User.findById(userId)
                        .then(user => {
                            if (user && user.role === role) {
                                try {
                                    ws.send(JSON.stringify(notification));
                                } catch (error) {
                                    console.debug('Error sending notification to role:', error);
                                    this.clients.delete(userId);
                                }
                            }
                        })
                        .catch(() => {
                            this.clients.delete(userId);
                        })
                );
            }
        });
        await Promise.all(promises);
    }

    // Send notification to all connected users
    broadcast(notification) {
        this.clients.forEach((ws, userId) => {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(JSON.stringify(notification));
                } catch (error) {
                    console.debug('Error broadcasting notification:', error);
                    this.clients.delete(userId);
                }
            } else {
                this.clients.delete(userId);
            }
        });
    }

    // Handle incoming messages from clients
    handleMessage(userId, data) {
        switch (data.type) {
            case 'ping':
                this.sendToUser(userId, { type: 'pong', timestamp: Date.now() });
                break;
            default:
                break; // Silently ignore unhandled message types
        }
    }

    // Notification helper methods
    async notifyOrderStatus(orderId, userId, status) {
        const notification = {
            type: 'order_status',
            orderId,
            status,
            timestamp: new Date(),
            message: `Your order #${orderId} is ${status}`
        };
        this.sendToUser(userId, notification);
    }

    async notifyLowStock(sellerId, bookId, title, quantity) {
        const notification = {
            type: 'low_stock',
            bookId,
            title,
            quantity,
            timestamp: new Date(),
            message: `Low stock alert: "${title}" has only ${quantity} units left`
        };
        this.sendToUser(sellerId, notification);
    }

    async notifyNewReview(sellerId, bookId, title, rating) {
        const notification = {
            type: 'new_review',
            bookId,
            title,
            rating,
            timestamp: new Date(),
            message: `New ${rating}-star review for "${title}"`
        };
        this.sendToUser(sellerId, notification);
    }

    async notifyPriceChange(bookId, title, oldPrice, newPrice) {
        const notification = {
            type: 'price_change',
            bookId,
            title,
            oldPrice,
            newPrice,
            timestamp: new Date(),
            message: `Price updated for "${title}" from $${oldPrice} to $${newPrice}`
        };
        this.broadcast(notification);
    }

    async notifyNewUser(user) {
        const notification = {
            type: 'new_user',
            userId: user._id,
            timestamp: new Date(),
            message: `New user registered: ${user.name}`
        };
        this.sendToRole('admin', notification);
    }
}

module.exports = new WebSocketService(); 