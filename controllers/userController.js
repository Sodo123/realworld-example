var mongoose = require('mongoose');
var User = mongoose.model('User');
var passport = require('../config/passport');

exports.get_user = (req, res, next) => {
    console.log(req.session);
    res.send('Not implemented: GET user');
}

exports.edit_user = (req, res) => {
    res.send('Not implemented: PUT user');
}

exports.register_user = (req, res) => {
    res.send('Not implemented: POST user');
}

exports.login = (req, res) => {
    res.render('./users/login', { message: req.flash('message') });
}

exports.do_login = (req, res, next) => {
    console.log('Do login ', req.body);
    // if(!req.body.user.email){
    //     return res.status(422).json({errors: {email: "can't be blank"}});
    //   }
    
    //   if(!req.body.user.password){
    //     return res.status(422).json({errors: {password: "can't be blank"}});
    //   }
    
      passport.authenticate('local',{ failureRedirect: '/login-failure', successRedirect: 'login-success' }, function(err, user, info){
        console.log('err', err);
        if(err){ return next(err); }
        console.log('user', user);
        if(user){
          //user.token = user.generateJWT();
          return res.json({user: user.toAuthJSON()});
        } else {
          return res.status(422).json(info);
        }
      })(req, res, next);
}