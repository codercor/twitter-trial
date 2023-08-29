const jwt = require("jsonwebtoken");


const auth = async (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ error: "Authorization header missing" });
    }
    try {
        const token = req.headers.authorization.split(" ")[1];
        let decodedData;
        if (token) {
            decodedData = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decodedData.user;
        } 
        next();
    } catch (error) {
        console.log(error);
    }
}

module.exports = auth;