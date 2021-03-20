var mongoose = require('mongoose');

var TxnSchema = new mongoose.Schema({
    sender : String,
    reciever : String,
    amount : Number,
    date : Date
});

module.exports = mongoose.model("Transaction", TxnSchema);