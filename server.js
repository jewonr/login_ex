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

// const upload = multer({
//     storage: multer.diskStorage({
//         destination(req, file, done) {
//             done(null, 'style/uploads/');
//         },
//         filename(req, file, cb) {
//             const ext = path.extname(file.originalname);	
//             const timestamp = new Date().getTime().valueOf();	
//             const filename = path.basename(file.originalname, ext) + timestamp + ext;
//             cb(null, filename);
//         }
//     }),
// })

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
    const contents = Content.find();
    (await contents).forEach(content => {
        items.push(content);
    });

    res.render('index.ejs', { 
        name: req.user.name,
        userId: req.user.id,
        contents: items
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
            creater: req.user.id
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

app.get('/create', checkAuthenticated, (req, res) => {
    res.render('create.ejs');
});

app.post('/create', checkAuthenticated, async (req, res) => {
    const content = new Content({
        title: req.body.title,
        text: req.body.text,
        creater: req.user.id
    });
    await content.save();

    res.redirect('/home');
});

app.get('/edit/:id', checkAuthenticated, async (req, res) => {
    const content = await Content.findById(req.params.id);
    console.log(content);
    res.render('edit.ejs', {
        content: content
    });
});

app.post('/edit', checkAuthenticated, async (req, res) => {
    await Content.updateOne({ _id: req.body.contentId }, {
        title: req.body.title,
        text: req.body.text
    });

    res.redirect('/home');
});

app.listen(3000, () => {
    console.log("Listening on port 3000");
});