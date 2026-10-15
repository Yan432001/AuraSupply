const { db } = require("../../config/utill/helper");
const { logError } = require("../../config/utill/logErr");

class setting_model {
    static async getAllBrands() {
        try {
        const query = "SELECT * FROM aura_brands";
        const [data] = await db.query(query);
        return data;
        } catch (error) {
            logError("setting_model.getAllBrands", error, null);
        }
    }
}

module.exports = setting_model;