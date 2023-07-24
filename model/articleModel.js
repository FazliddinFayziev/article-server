const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        authorName: {
            type: String, // Add the authorName property here
            required: true,
        },
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Comment',
            },
        ],
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        likesCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
