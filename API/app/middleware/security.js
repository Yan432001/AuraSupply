const { db } = require("../config/utill/helper");
const { trackLoginAttempt, clearOldAttempts } = require("../config/utill/loginTracker");
const getClientIp = require("../config/utill/getClientIp");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "ERTGGGEDSFDRE#5R###@";

// Login attempt limiter middleware
exports.loginLimiter = async (req, res, next) => {
    try {
        await clearOldAttempts();
        
        const ipAddress = getClientIp(req);
        const { username } = req.body;
        
        if (!username) {
            return res.status(400).json({ error: "Username required" });
        }

        const status = await trackLoginAttempt(ipAddress, username, false);
        
        if (status.blocked) {
            return res.status(429).json({
                error: "Too many failed attempts",
                message: status.message,
                blocked: true,
                minutesLeft: status.minutesLeft
            });
        }
        
        req.loginStatus = status;
        next();
    } catch (err) {
        console.error("Login limiter error:", err);
        next();
    }
};

// Enhanced JWT validation with permissions
exports.validateTokenWithPermissions = (requiredPermissions = []) => {
    return async (req, res, next) => {
        try {
            const authorization = req.headers.authorization;
            if (!authorization) {
                return res.status(401).json({ 
                    message: "Unauthorized - No token provided" 
                });
            }

            const token = authorization.split(" ")[1];
            if (!token) {
                return res.status(401).json({ 
                    message: "Unauthorized - Invalid token format" 
                });
            }

            jwt.verify(token, JWT_SECRET, async (err, decoded) => {
                if (err) {
                    return res.status(401).json({
                        message: "Invalid or expired token",
                        expired: err.name === 'TokenExpiredError'
                    });
                }

                // Verify user still exists and is active
                const [user] = await db.query(
                    `SELECT id, username, active, group_id 
                     FROM aura_users 
                     WHERE id = :id AND active = 1`,
                    { id: decoded.id }
                );

                if (user.length === 0) {
                    return res.status(401).json({
                        message: "User account not found or disabled"
                    });
                }

                // Check permissions if required
                if (requiredPermissions.length > 0) {
                    const hasPermission = await exports.checkPermissions(
                        decoded.id, 
                        decoded.group_id || user[0].group_id, 
                        requiredPermissions
                    );
                    
                    if (!hasPermission) {
                        return res.status(403).json({
                            message: "Insufficient permissions"
                        });
                    }
                }

                // Attach user data to request
                req.user = decoded;
                req.user_id = decoded.id;
                req.user_name = decoded.username;
                req.first_name = decoded.first_name;
                req.last_name = decoded.last_name;
                req.group_id = decoded.group_id || user[0].group_id;

                // Log successful authentication
                await exports.logUserLogin(req.user_id, getClientIp(req), true);
                
                next();
            });
        } catch (error) {
            console.error("Token validation error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    };
};

// Permission checker
exports.checkPermissions = async (userId, groupId, permissions) => {
    try {
        const sql = `
            SELECT * FROM aura_permissions 
            WHERE group_id = :groupId
        `;
        const [groupPermissions] = await db.query(sql, { groupId });
        
        if (groupPermissions.length === 0) {
            return false;
        }

        const perm = groupPermissions[0];
        for (const permission of permissions) {
            if (perm[permission] !== 1) {
                return false;
            }
        }
        
        return true;
    } catch (err) {
        console.error("Permission check error:", err);
        return false;
    }
};

// Log user login activity
exports.logUserLogin = async (userId, ipAddress, success) => {
    try {
        const loginTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        // Update user's last login
        await db.query(
            `UPDATE aura_users 
             SET last_login = UNIX_TIMESTAMP(), 
                 last_ip_address = :ipAddress 
             WHERE id = :userId`,
            { userId, ipAddress }
        );

        // Log login attempt
        await db.query(
            `INSERT INTO aura_user_logins 
             (user_id, ip_address, login, time) 
             VALUES (:userId, INET6_ATON(:ipAddress), :success, :loginTime)`,
            { 
                userId, 
                ipAddress, 
                success: success ? 'success' : 'failed',
                loginTime 
            }
        );
    } catch (err) {
        console.error("Log login error:", err);
    }
};

// Request logger middleware
exports.requestLogger = (req, res, next) => {
    const start = Date.now();
    const originalSend = res.send;
    
    res.send = function(data) {
        const duration = Date.now() - start;
        
        console.log({
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: getClientIp(req),
            userAgent: req.headers['user-agent']
        });
        
        originalSend.call(this, data);
    };
    
    next();
};