const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./router/userRoutes');
const articleRoutes = require('./router/articleRoutes');

dotenv.config();
const app = express();
app.use(express.json());

// Use the cors middleware to allow all origins
app.use(cors());



app.use('/api', userRoutes);
app.use('/api', articleRoutes);

// Connect to MongoDB
mongoose
    .connect('mongodb+srv://fazrez4515:ZmFmRf4515@cluster0.fwoxgwi.mongodb.net/?retryWrites=true&w=majority', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('Connected to MongoDB');
        // Start the server after successful database connection
        app.listen(3000, () => {
            console.log('Server is listening on port 3000');
        });
    })
    .catch((err) => {
        console.error('Error occurred while connecting to the database:', err);
    });

// Define a middleware to handle errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong.' });
});
