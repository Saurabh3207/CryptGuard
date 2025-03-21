const express = require('express');
const app = express();
const cors = require('cors');
const authenticationRoute = require('./routes/authenticationRoute');

app.use(cors());
app.use(express.json());
app.use('/api',authenticationRoute);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
    });  // Server is running on port 3000 