const { db } = require("../../config/utill/helper");
const { logError } = require("../../config/utill/logErr");

exports.getPermissions = async (req, res) => {
    try {
        const [data] = await db.query("SELECT * FROM aura_permissions");
        res.json({
            data: data,
        });
    } catch (err) {
        logError("add.permissions.controller", err, res);
    }
}

exports.deletePermissions = async (req, res) =>{
    try{
        const sql = "DELETE FROM aura_permissions WHERE id = :id";
        const [data] = await db.query(sql, { id: req.body.id });
        res.json({ success: true, data });
    }catch(err){
        logError("delete.permissions.controller", err, res);
    }
}