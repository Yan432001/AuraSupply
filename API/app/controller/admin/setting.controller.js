
// const { db } = require("../../config/utill/helper");
const { logError } = require("../../config/utill/logErr");
const setting_model  = require("../../models/general.model");

exports.getAllBrands = async (req, res) => {
    try{
        const brands = await setting_model.getAllBrands();
        res.json({
            brands,
        });
    }catch(err){
        logError("setting.controller", err, res);
    }
}
exports.getAllCategories = async (req, res) => {
    try{
        const categories = await setting_model.getAllCategories();
        res.json({
            categories,
        })
    }catch (err) {
        logError("setting.controller", err, res);
    }
}
exports.getAllZones = async (req, res) => {
    try{
        const zones = await setting_model.getAllZone();
        res.json({
            zones,
        })
    }catch (err) {
        logError("setting.controller", err, res);
    }
}

exports.getAllUnits = async (req, res) => {
    try {
        const units = await setting_model.getAllUnits();
        res.json({
            units,
        })
    }catch (err) {
        logError("setting.controller", err, res);
    }
}