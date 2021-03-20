var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    name : String,
    balance : Number,
    email : String
});

module.exports = mongoose.model("User", UserSchema);