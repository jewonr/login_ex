if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
// const multer = require('multer');
const path = require('path');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;

const User = require('./user');
const Content = require('./content');

const checkAuthenticated = (req, res, next) => {
    if(req.isAuthenticated()) {
        return next();
    }

    res.redirect('/login');
}

const checkNotAuthenticated = (req, res, next) => {
    if(req.isAuthenticated()) {
        return res.redirect('/home');
    }
    next();
}

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findOne({ id: id }, (err, user) => {
        done(err, user);
    });
});

passport.use(new LocalStrategy({
    usernameField: 'email', 
    passwordField: 'password'}, 
    (email, password, done) => {
    User.findOne({ email: email }, (err, user) => {
        if (err) return done(err); 
        if(!user) return done(null, false, { message: 'Incorrect username' }); 
        
        bcrypt.compare(password, user.password, (err, res) => {
            if (err) return done(err);
            if(res === false) return done(null, false, {message: 'Incorrect password'});

            return done(null, user);
        });
    });
}));

app.use(methodOverride('_method'));
app.use(express.static(__dirname + '/style'));
app.use(express.json());

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', error => console.error(error));
db.once('open', () => console.error('Connected to Mongoose'));

app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/home', checkAuthenticated, async (req, res) => {
    const items = [];
    const contents = Content.find({ creater: req.user.id });
    let weightOfProducts = [16, 10, 6, 3, 1, 7];
    let areaOfProducts = [1.26, 0.72, 0.8, 9.0, 1.24, 4.32]
    let sumWeight = 0;
    let sumArea = 0;
    let sum = 0;
    (await contents).forEach(content => {
        for(let i = 0; i < weightOfProducts.length; i++) {
            sumWeight += content.numberOfProduct[i] * weightOfProducts[i];
            sumArea += content.numberOfProduct[i] * areaOfProducts[i];
            sum += content.numberOfProduct[i];
        }
        items.push(content);
    });

    console.log(sumWeight);
    console.log(sumArea);

    res.render('index.ejs', { 
        name: req.user.name,
        userId: req.user.id,
        contents: items,
        sumWeight: sumWeight,
        sumArea: sumArea,
        sum: sum
    });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login?error=true',
    failureFlash: true
}));

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs');
});

app.post('/register', async (req, res) => {
    try {
        const hasedPassword = await bcrypt.hash(req.body.password, 10)
        const user = new User({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hasedPassword,
        });
        const newUser = await user.save();
 
        res.redirect('/login');
    } catch {
        res.redirect('/register', {
            errorMessage: 'Error creating User'
        });
    }
});

app.delete('/logout', (req, res) => {
    req.logOut();
    res.redirect('/');
});

app.post('/create', checkAuthenticated, async (req, res) => {
    console.log(req.body.numberOfAddedProduct);
    const content = new Content({
        numberOfProduct: req.body.numberOfAddedProduct,
        productName: req.body.productName,
        creater: req.user.id
    });
    await content.save();

    console.log(content);

    res.redirect('/home');
});

// app.get('/edit/:id', checkAuthenticated, async (req, res) => {
//     const content = await Content.findById(req.params.id);
//     console.log(content);
//     res.render('edit.ejs', {
//         content: content
//     });
// });

app.post('/edit', checkAuthenticated, async (req, res) => {
    await Content.updateOne({ _id: req.body.contentId }, {
        title: req.body.title,
        text: req.body.text
    });

    res.redirect('/home');
});

app.delete('/delete/:id', checkAuthenticated, async (req, res) => {
    await Content.findByIdAndDelete(req.params.id);
})

app.get('/:id', checkAuthenticated, async (req, res) => {
    console.log(req.params.id);
    const content = await Content.findById(req.params.id);
    res.render('content.ejs', { content: content });
})

app.listen(3000, () => {
    console.log("Listening on port 3000");
});