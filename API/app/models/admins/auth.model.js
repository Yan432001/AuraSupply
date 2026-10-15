const { db } = require("../../config/utill/helper");
const { logError } = require("../../config/utill/logErr");


class Auth_Model {
    static async getAllUser() {
        try {
        const query = "SELECT * FROM aura_users";
        const [data] = await db.query(query);
        return data;
        } catch (error) {
        logError("LoginModel.getAllUser", error, null);
        }
    }
    static async insertUser(){
        try{
            const sql = `
                INSERT INTO aura_users (
                    first_name,
                    last_name,
                    username,
                    password,
                    email,
                    group_id,
                    active,
                    ip_address,
                    last_ip_address,
                    created_on
                ) VALUES (
                    :first_name,
                    :last_name,
                    :username,
                    :password,
                    :email,
                    :group_id,
                    :active,
                    :ip_address,
                    :last_ip_address,
                    :created_on
                )`;
            return sql;
        } catch (error){
            logError("LoginModel.insertUser", error, null);
        }
    }
}

module.exports = Auth_Model;
