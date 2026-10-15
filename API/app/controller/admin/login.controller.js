const { db, access_token_key } = require("../../config/utill/helper");
const { logError } = require("../../config/utill/logErr");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
// call model 
const LoginModel = require("../../models/admins/login.model");

exports.getAllUser = async (req, res) => {
    try {
        const data = await LoginModel.getAllUser();
        res.json({
            data: data,
        });
    } catch (err) {
        logError("auth.controller", err, res);
    }
}
exports.register_lo = async (req, res) => {
    try {

        const sql = await LoginModel.insertUser();
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        const created_on = Math.floor(Date.now() / 1000);
        const [insert] = await db.query(sql, {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            username: req.body.username,
            password: hashedPassword,
            email: req.body.email,
            group_id: req.body.group_id || 3,
            active: req.body.active ?? 1,
            ip_address: clientIp,
            last_ip_address: clientIp,
            created_on
        });
        
        res.json({ success: true, insert });

    } catch (err) {
        logError("login.controller", err, res);
    }
};
exports.login_login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const query = "SELECT * FROM aura_users WHERE username = :username";
        const [data] = await db.query(query, { 
            username: username,
        });  
        if (data.length === 0) {
            res.json({
                error: {
                    message: "Username is incorrect",
                }
            })    
            
        }else {
            const isPass = data[0].password;
            const isCurrent =  bcrypt.compare(password, isPass); // true or false
            if (!isCurrent) {
                res.json({
                    error: {
                        message: "Password is incorrect",
                    }
                })
            }else {
                let obj = {
                    profile: data[0],
                    permissions : ['view','add', 'edit', 'delete'],
                }
                res.json({ 
                    success: true, 
                    ...obj,
                    access: access_token_key,
                    access_token: await getAccessToken(obj),
                });
            }
        }
    } catch (err) {
        logError("login.controller", err, res);
    }   
};

exports.profile_lo = async (req, res) => {
    try{
        res.json({
            current_id: req.current_id,
            profile: req.profile,
            permission: req.permissions,
        })
        // const query = "SELECT * FROM aura_users WHERE id = :id";
        // const [data] = await db.query(query, { 
        //     id: req.body.id,
        // });
        // res.json({ data: data.length > 0 ? data[0] : null });
    }catch (err) {
        logError("profile.controller", err, res);
    }
}

const getAccessToken = async (data) => {
    // const data = {
    //     id: 6666,
    //     name: "admin",
    // }
    const acess_toek = await jwt.sign({data: data}, access_token_key, {expiresIn: "180s"});
    return acess_toek;
}

exports.validate_token_test = () => {
    // call in midleware in  route (role route, user route, teacher rout)
    return (req, res, next)  => {
        var authorization = req.headers.authorization; // token from client 
        var token_from_client = null;

        if (authorization != null && authorization != ""){
            token_from_client = authorization.split(" "); // authorization : "Bearer key token (ERTGGGEDSFDRE#5R###@ alraeady bycrypt)"
            token_from_client = token_from_client[1]; // get only access_token 
        }
        if (token_from_client == null){
            res.status(401).send({
                message: "Unauthorized",
            });
        }else{
            jwt.verify(token_from_client, access_token_key, (error, result) => {
                if(error){
                    res.status(401).send({
                        message: "Unauthorized",
                        error: error,
                    })
                }else{
                    req.current_id = result.data.profile.id; // write user property
                    req.profile = result.data.profile; // write user property
                    req.permissions = result.data.permissions; // write user property
                    next(); // continue controller 
                }
            })
        }

    }
}