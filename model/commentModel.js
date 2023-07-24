const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        article: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Article',
            required: true,
        },
    },
    { timestamps: true }
);


const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
