const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
    title: {
        type: String
    },

    text: {
        type: String
    },

    createAt: {
        type: Date,
        default: Date.now
    },

    creater: {
        type: String,
        required: true,
        ref: 'User' 
    },
});

const content = mongoose.model('Content', ContentSchema);

module.exports = content;