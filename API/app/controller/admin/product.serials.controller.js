const { db, DB_PREFIX } = require("../../config/utill/helper")
const { logErr } = require("../../config/utill/logErr")

exports.getPorductSerials = async (req, res) => {
    try{
        const tableName = DB_PREFIX + "product_serials";
        const [data] = await db.query(`SELECT * FROM ${tableName}`);

        res.json({
            data: data,
        })
    }catch(err){
        logErr("product.serials.controller", err, res)
    }
}