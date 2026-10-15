const { db } = require("./helper");
const moment = require("moment");

const MAX_ATTEMPTS = 3;
const BLOCK_DURATION_MINUTES = 5;

exports.trackLoginAttempt = async (ipAddress, username, success) => {
    try {
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        
        // Check if there's an existing record
        const [existing] = await db.query(
            `SELECT * FROM aura_login_attempts 
             WHERE ip_address = INET6_ATON(:ipAddress) 
             AND username = :username`,
            { ipAddress, username }
        );

        if (existing.length > 0) {
            const record = existing[0];
            
            // Check if blocked
            if (record.blocked_until && moment(record.blocked_until).isAfter(now)) {
                const minutesLeft = moment(record.blocked_until).diff(moment(), 'minutes');
                return {
                    blocked: true,
                    minutesLeft: minutesLeft,
                    message: `Account blocked. Try again in ${minutesLeft} minutes.`
                };
            }

            if (success) {
                // Reset on successful login
                await db.query(
                    `DELETE FROM aura_login_attempts 
                     WHERE ip_address = INET6_ATON(:ipAddress) 
                     AND username = :username`,
                    { ipAddress, username }
                );
                return { blocked: false };
            } else {
                // Increment failed attempts
                const newAttempts = record.attempts + 1;
                let blockedUntil = null;
                
                if (newAttempts >= MAX_ATTEMPTS) {
                    blockedUntil = moment().add(BLOCK_DURATION_MINUTES, 'minutes').format('YYYY-MM-DD HH:mm:ss');
                }

                await db.query(
                    `UPDATE aura_login_attempts 
                     SET attempts = :newAttempts, 
                         last_attempt = :now,
                         blocked_until = :blockedUntil
                     WHERE id = :id`,
                    { 
                        newAttempts, 
                        now, 
                        blockedUntil,
                        id: record.id 
                    }
                );

                if (newAttempts >= MAX_ATTEMPTS) {
                    return {
                        blocked: true,
                        minutesLeft: BLOCK_DURATION_MINUTES,
                        attemptsLeft: 0,
                        message: `Too many failed attempts. Blocked for ${BLOCK_DURATION_MINUTES} minutes.`
                    };
                }

                return {
                    blocked: false,
                    attemptsLeft: MAX_ATTEMPTS - newAttempts,
                    message: `Incorrect password. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`
                };
            }
        } else {
            if (!success) {
                // First failed attempt
                await db.query(
                    `INSERT INTO aura_login_attempts 
                     (ip_address, username, attempts, last_attempt, created_at) 
                     VALUES (INET6_ATON(:ipAddress), :username, 1, :now, :now)`,
                    { ipAddress, username, now }
                );
                
                return {
                    blocked: false,
                    attemptsLeft: MAX_ATTEMPTS - 1,
                    message: `Incorrect password. ${MAX_ATTEMPTS - 1} attempts remaining.`
                };
            }
            return { blocked: false };
        }
    } catch (err) {
        console.error("Login tracker error:", err);
        return { blocked: false, error: "Tracking system error" };
    }
};

exports.clearOldAttempts = async () => {
    try {
        const cutoff = moment().subtract(24, 'hours').format('YYYY-MM-DD HH:mm:ss');
        await db.query(
            `DELETE FROM aura_login_attempts 
             WHERE (created_at < :cutoff AND blocked_until IS NULL) 
             OR (blocked_until < :cutoff)`,
            { cutoff }
        );
    } catch (err) {
        console.error("Clear old attempts error:", err);
    }
};

exports.getLoginStatus = async (ipAddress, username) => {
    try {
        const [result] = await db.query(
            `SELECT * FROM aura_login_attempts 
             WHERE ip_address = INET6_ATON(:ipAddress) 
             AND username = :username`,
            { ipAddress, username }
        );

        if (result.length === 0) {
            return { attempts: 0, blocked: false };
        }

        const record = result[0];
        const now = moment();
        const blocked = record.blocked_until && moment(record.blocked_until).isAfter(now);
        
        return {
            attempts: record.attempts,
            blocked,
            blockedUntil: record.blocked_until,
            lastAttempt: record.last_attempt
        };
    } catch (err) {
        console.error("Get login status error:", err);
        return { attempts: 0, blocked: false };
    }
};