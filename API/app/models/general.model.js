const { db } = require("../config/utill/helper");
const { logError } = require("../config/utill/logErr");

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
    static async getAllCategories() {
        try{
            const sql = "SELECT * FROM aura_categories";
            const [data] = await db.query(sql);
            return data;
        }catch(err){
            logError("general_model.getAllCategories", err, null)
        }
    }
    static async getAllZone() {
        try{
            const sql = "SELECT * FROM aura_zones";
            const [data] = await db.query(sql);
            return data;
        }catch(err){
            logError("general_model.getAllZone", err, null)
        }
    }
    static async getAllUnits(){
        try {
            const sql = "SELECT * FROM aura_units";
            const [data] = await db.query(sql);
            return data;
        }catch(err){
            logError("general_model.getAllUnits", err, null);
        }
    }
}

module.exports = setting_model;