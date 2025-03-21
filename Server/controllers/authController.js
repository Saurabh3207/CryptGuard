const ethers = require("ethers");

async function authController(req, res, next) {
  try {
    const { signature } = req.body;
    const { address } = req.query;

    if (!signature) {
      return res.status(400).json({ message: "Signature is required" });
    }

    // The message signed by the user
    const message =
      "Welcome to CryptGuard! Please sign this message to authenticate your account";

    // Recover the address from the signature
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    console.log("Recovered Address: ", recoveredAddress);

    // Compare the recovered address with the address sent from frontend
    if (address.toLowerCase() === recoveredAddress.toLowerCase()) {
      return res.status(200).json({ message: "Authentication Successful" });
    } else {
      return res.status(401).json({ message: "Authentication Failed" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = { authController };
