const {db} = require("../../config/utill/helper"); 
const { logError } = require("../../config/utill/logErr");


exports.getBorrower = async (req, res) => {
    try{

        const [data] = await db.query("SELECT * FROM aura_loan_borrowers");
        res.json({
            data: data,
        })
    }catch(err){
        logError("borrower.controller", err, res);
    }
}

exports.addBorrower = (req, res) => {
    res.json({
        data:[2]
    })
}

exports.updateBorrower = (req, res) => {
    res.json({
        data: [3]
    })
}

exports.deleteBorrower = (req, res) => {
    res.json({
        data: [4]
    })
}

