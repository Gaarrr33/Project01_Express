var jwt = require('jsonwebtoken');

function verifyToken(req, res, next){
    const token = req.header('Autorization')?.replace('Bearer','');
    if(!token){
        return res.status(403).json({message: 'token tidak tersedia'});
    }
    jwt.verify(token, process.env. JWT_SECRET, (err, decoded) =>{
        if(err){
            return res.status(401).json({message: 'token tidak valid'});
        }
        req.user = decoded;
        next();
    });
}

module.exports = verifyToken