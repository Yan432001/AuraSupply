const { db } = require("../../config/utill/helper");
const { logError } = require("../../config/utill/logErr");

exports.getAddress = async (req, res) => {
    try{
        const [data] = await db.query("SELECT * FROM aura_addresses");
        res.json({
            data: data,
        })
    }catch(err){
        logError('address.controller', err, res);
    }
}