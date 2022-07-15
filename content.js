const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
    createAt: {
        type: Date,
        default: Date.now
    },

    numberOfProduct: {
        type: Array,
        required: true
    },

    productName: {
        type: Array,
        required: true
    },

    creater: {
        type: String,
        required: true,
        ref: 'User' 
    },
});

const content = mongoose.model('Content', ContentSchema);

module.exports = content;