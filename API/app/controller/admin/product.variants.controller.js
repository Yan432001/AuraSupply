const { db, DB_PREFIX } = require("../../config/utill/helper")
const { logErr } = require("../../config/utill/logErr")

exports.getPorductVariants = async (req, res) => {
    try{
        const tableName = DB_PREFIX + "product_variants";
        const [data] = await db.query(`SELECT * FROM ${tableName}`);

        res.json({
            data: data,
        })
    }catch(err){
        logErr("product.variants.controller", err, res)
    }
}