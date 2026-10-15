/**
 * SECURITY MIDDLEWARE
 * ===================
 * Collection of security middleware functions for authentication,
 * authorization, rate limiting, CORS, and audit logging
 * 
 * Features:
 * - JWT token validation
 * - Permission enforcement
 * - IP whitelist restriction
 * - Rate limiting (DoS protection)
 * - CORS security headers
 * - Request logging and audit trail
 */

const jwt = require('jsonwebtoken');
const getClientIp = require('../../config/utill/getClientIp');
const PermissionModel = require('../../models/admins/permissions.model');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || "ERTGGGEDSFDRE#5R###@";
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window

// In-memory rate limiter store (replace with Redis in production)
const rateLimitStore = new Map();

/**
 * VALIDATE TOKEN
 * ==============
 * Middleware to validate JWT token from Authorization header
 * Extracts and attaches user data to request object
 * 
 * Usage in routes:
 * app.get("/api/protected", validateToken(), controllerFunction);
 * 
 * Header format:
 * Authorization: Bearer <token>
 * 
 * @returns {Function} Express middleware function
 * 
 * Attached to req:
 * - req.user: Full decoded JWT payload
 * - req.user_id: User ID
 * - req.user_name: Username
 * - req.first_name: First name
 * - req.last_name: Last name
 * - req.group_id: User's group/role ID
 */
const validateToken = () => {
    return (req, res, next) => {
        try {
            const authorization = req.headers.authorization;

            if (!authorization) {
                return res.status(401).json({
                    success: false,
                    message: "No authorization header"
                });
            }

            const token = authorization.split(" ")[1];
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token format"
                });
            }

            jwt.verify(token, JWT_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).json({
                        success: false,
                        message: "Invalid or expired token"
                    });
                }

                // Attach user data to request
                req.user = decoded;
                req.user_id = decoded.id;
                req.user_name = decoded.username;
                req.first_name = decoded.first_name;
                req.last_name = decoded.last_name;
                req.group_id = decoded.group_id;

                next();
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: "Token validation error"
            });
        }
    };
};

/**
 * CHECK PERMISSION
 * ================
 * Middleware to enforce permission-based access control
 * Checks if user's group has required permission(s)
 * 
 * Usage in routes:
 * app.get("/api/products", validateToken(), checkPermission('products-index'), controller);
 * 
 * Multiple permissions (require ALL):
 * checkPermission(['products-add', 'products-edit'])
 * 
 * @param {string|Array} requiredPermissions - Single permission or array of permissions
 * @returns {Function} Express middleware function
 * 
 * Sets:
 * - res.status(403) if permission denied
 * - Calls next() if permitted
 */
const checkPermission = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            // Ensure user is authenticated (validateToken should run first)
            if (!req.user_id || !req.group_id) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
            }

            // Convert string to array for consistent processing
            const permissions = Array.isArray(requiredPermissions)
                ? requiredPermissions
                : [requiredPermissions];

            // Check all required permissions
            for (const permission of permissions) {
                const hasPermission = await PermissionModel.hasPermission(
                    req.group_id,
                    permission
                );

                if (!hasPermission) {
                    return res.status(403).json({
                        success: false,
                        message: `Permission denied: ${permission} required`,
                        required_permission: permission
                    });
                }
            }

            // All permissions granted
            next();
        } catch (err) {
            console.error("Permission check error:", err);
            return res.status(500).json({
                success: false,
                message: "Permission check failed"
            });
        }
    };
};

/**
 * IP WHITELIST
 * ============
 * Middleware to restrict access to whitelisted IP addresses only
 * Useful for admin endpoints or sensitive operations
 * 
 * Usage in routes:
 * app.post("/api/admin/backup", ipWhitelist(['192.168.1.1', '10.0.0.5']), controller);
 * 
 * @param {Array<string>} allowedIPs - Array of allowed IP addresses
 * @returns {Function} Express middleware function
 */
const ipWhitelist = (allowedIPs) => {
    return (req, res, next) => {
        const clientIp = getClientIp(req);

        if (!allowedIPs.includes(clientIp)) {
            return res.status(403).json({
                success: false,
                message: "Access denied: IP not whitelisted",
                client_ip: clientIp
            });
        }

        next();
    };
};

/**
 * RATE LIMITER
 * ============
 * Middleware to prevent DoS attacks and brute force
 * Tracks requests per IP address and path
 * 
 * Usage in routes:
 * app.post("/api/auth/login", rateLimiter({
 *     windowMs: 15*60*1000,    // 15 minutes
 *     maxAttempts: 50           // max 50 requests per window
 * }), loginController);
 * 
 * Configuration:
 * - windowMs: Time window in milliseconds (default: 15 min)
 * - maxAttempts: Max requests allowed in window (default: 100)
 * 
 * NOTE: For production, use Redis instead of in-memory store
 * 
 * @param {object} options - Configuration options
 * @returns {Function} Express middleware function
 */
const rateLimiter = (options = {}) => {
    const windowMs = options.windowMs || RATE_LIMIT_WINDOW_MS;
    const maxAttempts = options.maxAttempts || RATE_LIMIT_MAX_REQUESTS;

    return (req, res, next) => {
        try {
            const clientIp = getClientIp(req);
            const key = `${clientIp}:${req.path}`;
            const now = Date.now();

            // Get current limit data
            let limitData = rateLimitStore.get(key);

            // Initialize if first request
            if (!limitData) {
                rateLimitStore.set(key, {
                    count: 1,
                    resetTime: now + windowMs
                });
                return next();
            }

            // Reset if window expired
            if (now > limitData.resetTime) {
                rateLimitStore.set(key, {
                    count: 1,
                    resetTime: now + windowMs
                });
                return next();
            }

            // Check if limit exceeded
            if (limitData.count >= maxAttempts) {
                const resetTime = new Date(limitData.resetTime);
                return res.status(429).json({
                    success: false,
                    message: "Too many requests, please try again later",
                    retry_after: Math.ceil((limitData.resetTime - now) / 1000),
                    reset_time: resetTime
                });
            }

            // Increment counter
            limitData.count++;
            rateLimitStore.set(key, limitData);

            // Add headers
            res.setHeader('X-RateLimit-Limit', maxAttempts);
            res.setHeader('X-RateLimit-Remaining', maxAttempts - limitData.count);
            res.setHeader('X-RateLimit-Reset', new Date(limitData.resetTime).toISOString());

            next();
        } catch (err) {
            console.error("Rate limiter error:", err);
            next(); // Continue even if rate limiter fails
        }
    };
};

/**
 * CORS SECURITY
 * =============
 * Middleware to set CORS security headers
 * Configures allowed origins, methods, and headers
 * 
 * Usage:
 * app.use(corsSecurity);
 * 
 * Or for specific route:
 * app.get("/api/data", corsSecurity, controller);
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Express next function
 */
const corsSecurity = (req, res, next) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['*'];
    const origin = req.headers.origin;

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '3600');

    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
};

/**
 * REQUEST LOGGER
 * ==============
 * Middleware to log all API requests
 * Used for audit trail and debugging
 * 
 * Usage:
 * app.use(requestLogger);
 * 
 * Logs:
 * - Method and path
 * - Request status code
 * - Client IP address
 * - Authenticated user ID (if applicable)
 * - Request duration
 * - Timestamp
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const clientIp = getClientIp(req);
    const userId = req.user_id || 'anonymous';
    const method = req.method;
    const path = req.path;

    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Log the request
        const logMessage = `[${new Date().toISOString()}] ${method} ${path} - Status: ${statusCode} - IP: ${clientIp} - User: ${userId} - Duration: ${duration}ms`;
        console.log(logMessage);

        // Call original send
        res.send = originalSend;
        return res.send(data);
    };

    next();
};

// Export all middleware functions
module.exports = {
    validateToken,
    checkPermission,
    ipWhitelist,
    rateLimiter,
    corsSecurity,
    requestLogger
};
