const { db, DB_PREFIX } = require("../../config/utill/helper");
const { logError } = require("../../config/utill/logErr");
exports.getProductOptions = async (req, res) => {
    try{
        const tableName = DB_PREFIX + "product_options";
        const [data] = await db.query(`SELECT * FROM ${tableName}`);

        res.json({
            data: data,
        })
    }catch(err){
        logError("porduct.options.controller", err, res);
    }
}