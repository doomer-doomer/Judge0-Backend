const jwt = require('jsonwebtoken');
require('dotenv').config();

function authToken(ID){
    const payload={
        user:ID
    };
    return jwt.sign(payload,process.env.AUTH_KEY,{expiresIn:"24h"});
}

module.exports = authToken;