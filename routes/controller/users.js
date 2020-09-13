var router = require('express').Router();
var passport = require('passport');

const isAuth = require('../authMiddleware').isAuth;
const isAdmin = require('../authMiddleware').isAdmin;

router.post('/login', passport.authenticate('local', { failureRedirect: '/login-failure', successRedirect: 'login-success' }));

router.get('/login',(req, res, next) => {
    res.render('./users/login', { message: req.flash('message') });
});

router.get('/login-success', (req, res, next) => {
    res.send('<p>You successfully logged in. --> <a href="/protected-route">Go to protected route</a></p>');
});

router.get('/login-failure', (req, res, next) => {
    res.send('You entered the wrong password.');
});

router.get('/protected-route', isAuth, (req, res, next) => {
    res.send('You made it to the route.');
});

router.get('/admin-route', isAdmin, (req, res, next) => {
    res.send('You made it to the admin route.');
});

module.exports = router;