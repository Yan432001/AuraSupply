const {getAddress} = require("../../../controller/admin/address.controller");

module.exports = (app) => {
    app.get('/api/address', getAddress);
}