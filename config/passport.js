var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

passport.use(new LocalStrategy({
  usernameField: 'user[email]',
  passwordField: 'user[password]'
}, function(email, password, cb) {
  console.log('email ', email, password);
  User.findOne({email: email}).then(function(user){
    console.log('user xxx', user);
    if(!user || !user.validPassword(password)){
      return cb(null, false, {errors: {'email or password': 'is invalid'}});
    }

    return cb(null, user);
  }).catch(cb);
}));

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  User.findById(id, function (err, user) {
      if (err) { return cb(err); }
      cb(null, user);
  });
});

module.exports = passport;

