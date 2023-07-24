const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../model/userModel');



// Middleware to verify the JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res
            .status(401)
            .json({ success: false, message: 'Token was not provided.' });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decodedToken.userId;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
};

// Middleware to check if the user is an admin
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized. Only admin users can access this resource.',
            });
        }
        next();
    } catch (err) {
        next(err);
    }
};

// Route to handle user registration
router.post('/signup', async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const newUser = await User.create({ name, email, password });

        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            success: true,
            data: {
                userId: newUser.id,
                email: newUser.email,
                token: token,
            },
        });
    } catch (err) {
        next(err);
    }
});


// LOGIN ROUTER
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find the user by email
        const user = await User.findOne({ email: email });

        // If user not found or password doesn't match, return an error
        if (!user || user.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Wrong details. Please check your credentials.',
            });
        }

        // If the user and password match, create and send the JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            success: true,
            data: {
                userId: user.id,
                email: user.email,
                isAdmin: user.isAdmin, // Include isAdmin in the response data
                token: token,
            },
        });
    } catch (err) {
        next(err);
    }
});


// Route to update a user's role (only accessible by admin)

router.put('/users/:userId', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { isAdmin } = req.body;

        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        // Update the user's role to admin if isAdmin is true, else set to regular user
        user.isAdmin = isAdmin;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                userId: user.id,
                email: user.email,
                isAdmin: user.isAdmin,
            },
        });
    } catch (err) {
        next(err);
    }
});



router.get('/users', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
});


module.exports = router;
