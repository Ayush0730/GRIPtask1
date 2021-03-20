const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const flash = require("connect-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");

require("dotenv").config();

app.use(session({ 
    secret:'geeksforgeeks', 
    saveUninitialized: true, 
    resave: true
})); 
app.use(flash());
app.use(function(req, res, next){
    res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(cookieParser());

const User = require('./models/user');
const Transaction = require('./models/txnHistory');

const uri = process.env.MONGODB_URI;
mongoose.connect(uri, {useNewUrlParser : true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false});
app.locals.moment = require("moment");

app.get('/', function(req, res){
    res.render('home.ejs', {success : ""});
});

app.get('/customers', function(req,res){
    User.find({},function(err, users){
        res.render('customers.ejs',{customers : users});
    });
});

app.get('/customers/:name', function(req,res){
    // find customer with name = req.params.name 
    User.findOne({name : req.params.name}, function(err, user){
        if(err){
            req.flash("error",err.message);
            res.redirect("back");
        }
        else{
            User.find({}, function(err, allUsers){
                if(err){
                    req.flash("error", "Something went wrong");
                    return res.redirect("back");
                }
                res.render('transfer.ejs', {user: user, allUsers: allUsers});
            });
        }
    })
});

app.post('/customers/:name/transfer', async function(req,res){
    var sender = req.params.name;
    var reciever = req.body.reciever;
    var amount = req.body.amount;
    if(amount <= 0) {
        req.flash("error", "Enter amount more than zero");
        return res.redirect("back");
    }
    var myError = false;
    await User.findOne({name: sender}, async function(err, sentBy){
        if(err) return console.error(err);
        if(sentBy.balance < amount){
            myError = true;
            req.flash("error", "Balance not sufficient");
            return res.redirect("back");
        }
        sentBy.balance -= amount;
        await sentBy.save();
    });
    await User.findOne({name: reciever}, async function(err, recBy){
        if(err || myError) return console.log("error");
        recBy.balance += Number(amount);
        await recBy.save();
        const txn = new Transaction({
            sender : sender,
            reciever : reciever,
            amount : amount,
            date : Date.now()
        });
        await txn.save();
        req.flash("success", "Transfer Success");
        res.redirect("/customers");
    });
});

app.get('/new',function(req,res){
    res.render('newUser.ejs');
});

app.post('/new', function(req, res){
    // console.log(req.body);
    const newUser = new User({name : req.body.name , balance: req.body.balance, email : req.body.email});
    newUser.save(function(err, user){
        if(err){
            req.flash("error", "Something Went Wrong");
            return res.redirect("back");
        }
        console.log("User created");
        req.flash("success", "New User Has Been Created");
        return res.redirect('/customers');
    });
});

app.get('/history', function(req,res){
    Transaction.find({}, function(err, history){
        if(err){
            req.flash("error","Something Went Wrong");
            return res.redirect("back");
        }
        res.render('history', {history : history});
    })
});

app.listen(process.env.PORT || 3000, process.env.IP, function(){
    console.log(`Server started at localhost:${process.env.PORT || 3000}`);
});