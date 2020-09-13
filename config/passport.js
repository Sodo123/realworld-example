var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
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
  console.log('serializeUser');
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  console.log('deserializeUser');
  User.findById(id, function (err, user) {
      if (err) { return cb(err); }
      cb(null, user);
  });
});


