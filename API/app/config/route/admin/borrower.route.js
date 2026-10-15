const { getBorrower, addBorrower, updateBorrower, deleteBorrower } = require('../../../controller/admin/borrower.controller');
const  { token_key_login } = require("../../../controller/admin/auth.controller");
module.exports = (app) => {
    app.get('/api/borrower', token_key_login(), getBorrower);
    app.post('/api/borrower', token_key_login(), addBorrower);
    app.put('/api/borrower', token_key_login(), updateBorrower);
    app.delete('/api/borrower', token_key_login(), deleteBorrower);
};