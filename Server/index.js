const express = require('express');
const app = express();
const cors = require('cors');
const {MONGODB_URL, PORT} = require('./config/serverConfig');
const {connectDB} = require('./db/connect');
const authenticationRoute = require('./routes/authenticationRoute');
const uploadFileRoute = require('./routes/uploadFileRoute');
const fileRoute = require('./routes/fileRoute');
const decryptRoute = require('./routes/decryptRoute');

app.use(cors());
app.use(express.json());
app.use('/api',authenticationRoute);
app.use('/api',uploadFileRoute);
app.use('/api', fileRoute);
app.use('/api', decryptRoute);

async function serverStart (){
    try {
        await connectDB(MONGODB_URL);
        console.log('Connected to the database');
        app.listen(PORT, () => {
            console.log('Server is running on port 3000');
            });  // Server is running on port 3000 
    } catch (error) {
        console.log(error);
    }

}
// function to start the server
serverStart();

 