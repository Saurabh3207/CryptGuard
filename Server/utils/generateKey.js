const crypto = require('crypto');

//function to generate a secure Encryption key

const generateEncryptionKey = (length) => {
    return crypto.randomBytes(length/2).toString('hex'); //generates a random string of bytes and converts it to hexadecimal
};


module.exports = {generateEncryptionKey};