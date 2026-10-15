const connection = require("./connection");
const { config } = require("./config");
const { logError } = require("./logErr");

exports.db = connection;
exports.err = logError;
exports.DB_PREFIX = config.db.PREFIX;
exports.access_token_key = config.token.access_token_key;

// defualt function like bpas 

exports.isQty = (data) => {
    return true;
}