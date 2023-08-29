const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password:{
        type: String,
        required: true,
    },
    oauth_token: {
        type: String,
    },
    oauth_token_secret: {
        type: String,
    },
    twitterAccessToken: {
        type: String,
    },
    twitterAccessSecret: {
        type: String,
    },
});

const User = mongoose.model('User', userSchema);

module.exports = User;