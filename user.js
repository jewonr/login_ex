const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },

    createAt: {
        type: Date,
        default: Date.now
    }
});

const user = mongoose.model('User', UserSchema);

module.exports = user;