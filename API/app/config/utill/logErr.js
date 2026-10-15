const fs = require("fs/promises");
const moment = require("moment");

exports.logError = async (controller, message_err, res) => {
    try {
        const timestamp = moment().format("DD/MM/YYYY HH:mm:ss");
        const logDir = "./error";
        try { await fs.mkdir(logDir, { recursive: true }); } catch (_) {}
        const path = logDir + "/" + controller + ".txt";
        const logMessage = "[" + timestamp + "]" + (message_err?.stack || message_err) + "\n";
        await fs.appendFile(path, logMessage);
    } catch(err) {
        console.error("Error writing to log file:", err);
    }
   
    if (res && typeof res.status === 'function') {
        res.status(500).json({ error: message_err?.message || String(message_err) });
    }
};
// npm install moment    // is time 
// create new folder name logs 
