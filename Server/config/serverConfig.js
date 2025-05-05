require ('dotenv').config();


module.exports = {
    MONGODB_URL: process.env.MONGODB_URL,
    PORT: process.env.PORT || 3000,
    JWT_SECRETKEY: process.env.JWT_SECRETKEY,
    PINATA_JWT : process.env.PINATA_JWT,
    PINATA_GATEWAY : process.env.PINATA_GATEWAY
}