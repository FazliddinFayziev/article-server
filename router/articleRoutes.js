const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Article = require('../model/articleModel');
const Comment = require('../model/commentModel');
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

router.post('/articles/:userId', verifyToken, async (req, res, next) => {
    try {
        const { title, content } = req.body;
        const { userId } = req.params;

        // Find the user by their ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Extract the user name from the user data
        const userName = user.name;

        // Create the article with userId and userName
        const article = await Article.create({
            title,
            content,
            author: userId,
            authorName: userName,
        });

        res.status(201).json({ success: true, data: article });
    } catch (err) {
        next(err);
    }
});




// Route to get all articles with selected fields
router.get('/articles', verifyToken, async (req, res, next) => {
    try {
        const articles = await Article.find({}, 'title content _id author authorName likesCount createdAt')
            .sort({ createdAt: -1 })
            .limit(10);

        // Process the articles to extract only the date part from createdAt
        const processedArticles = articles.map((article) => {
            const { title, content, _id, author, authorName, likesCount, createdAt } = article;

            // Check if createdAt is a valid Date object before calling toISOString()
            const datePart = createdAt instanceof Date ? createdAt.toISOString().slice(0, 10) : null;
            return { title, content, _id, author, authorName, likesCount, createdAt: datePart };
        });

        res.status(200).json({ success: true, data: processedArticles });
    } catch (err) {
        next(err);
    }
});


router.get('/articlespopular', async (req, res, next) => {
    try {
        const articles = await Article.find({}, 'title content _id author authorName likesCount createdAt')
            .sort({ createdAt: -1 })
            .limit(3);

        // Process the articles to extract only the date part from createdAt
        const processedArticles = articles.map((article) => {
            const { title, content, _id, author, authorName, likesCount, createdAt } = article;

            // Check if createdAt is a valid Date object before calling toISOString()
            const datePart = createdAt instanceof Date ? createdAt.toISOString().slice(0, 10) : null;
            return { title, content, _id, author, authorName, likesCount, createdAt: datePart };
        });

        res.status(200).json({ success: true, data: processedArticles });
    } catch (err) {
        next(err);
    }
});



// Route to get all articles created by a single user
router.get('/users/:userId/articles', verifyToken, async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Find the user by their userId and select only the name and email fields
        const user = await User.findById(userId).select('name email');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const articles = await Article.find({ author: userId }).populate('author', 'name email');

        res.status(200).json({ success: true, data: { user, articles } });
    } catch (err) {
        next(err);
    }
});





// Route to get a single article with comments and reviews
router.get('/articles/:articleId', verifyToken, async (req, res, next) => {
    try {
        const { articleId } = req.params;

        const article = await Article.findById(articleId)
            .populate({
                path: 'comments',
                populate: {
                    path: 'author',
                    select: 'name email',
                },
            })

        if (!article) {
            return res.status(404).json({
                success: false,
                message: 'Article not found.',
            });
        }

        res.status(200).json({ success: true, data: article });
    } catch (err) {
        next(err);
    }
});




// Route to delete a single article
router.delete('/articles/:articleId', verifyToken, async (req, res, next) => {
    try {
        const { articleId } = req.params;

        const article = await Article.findById(articleId);

        if (!article) {
            return res.status(404).json({
                success: false,
                message: 'Article not found.',
            });
        }

        // Check if the user is the author of the article
        if (article.author.toString() !== req.userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized to delete this article.',
            });
        }

        // Delete the article
        await article.deleteOne();

        res.status(200).json({ success: true, data: { message: 'Article deleted successfully.' } });
    } catch (err) {
        next(err);
    }
});




// Route to add a comment to an article
router.post('/articles/:articleId/comments', verifyToken, async (req, res, next) => {
    try {
        const { content } = req.body;
        const { articleId } = req.params;

        const comment = await Comment.create({
            content,
            author: req.userId,
            article: articleId,
        });

        // Add the comment to the article's comments array
        await Article.findByIdAndUpdate(articleId, { $push: { comments: comment._id } });

        res.status(201).json({ success: true, data: comment });
    } catch (err) {
        next(err);
    }
});


// Route to like an article
router.post('/articles/:articleId/like', verifyToken, async (req, res, next) => {
    try {
        const { articleId } = req.params;

        // Check if the user has already liked the article
        const article = await Article.findById(articleId);

        if (article.likes.includes(req.userId)) {
            return res.status(400).json({ success: false, message: 'You have already liked this article.' });
        }

        // Add the user ID to the article's likes array
        await Article.findByIdAndUpdate(articleId, { $push: { likes: req.userId } });

        // Increment the number of likes in the article
        await Article.findByIdAndUpdate(articleId, { $inc: { likesCount: 1 } });

        res.status(201).json({ success: true, message: 'Article liked successfully.' });
    } catch (err) {
        next(err);
    }
});








module.exports = router;
