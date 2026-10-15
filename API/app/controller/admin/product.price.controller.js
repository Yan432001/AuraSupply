const {db, DB_PREFIX} = require("../../config/utill/helper");
const { logError } = require("../../config/utill/logErr");

exports.getProductPrice = async (req, res) => {
    try{
        const tableName = DB_PREFIX + "product_prices"
        const [data] = await db.query(`SELECT * FROM ${tableName}`);
        res.json({
            data: data,
        })
    }catch(err){
        logError("product.price.controller", err, res);
    }
}