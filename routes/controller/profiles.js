var router = require('express').Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');

const isAuth = require('../authMiddleware').isAuth;
const isAdmin = require('../authMiddleware').isAdmin;

// Preload user profile on routes with ':username'
router.param('username', function(req, res, next, username){
  User.findOne({username: username}).then(function(user){
    if (!user) { return res.sendStatus(404); }
    console.log('username ', username);
    req.profile = user;

    return next();
  }).catch(next);
});

router.get('/', (req, res) => {
  res.render('./profiles/index', { message: req.flash('message') });
});

router.get('/:username', function(req, res, next){
  if(req.profile){
    return res.render('./profiles/index', {profile: req.profile});
  } else {
    return res.json({profile: req.profile.toProfileJSONFor(false)});
  }
});

router.post('/:username/follow', isAuth, function(req, res, next){
  var profileId = req.profile._id;


    if (!req.user) { return res.sendStatus(401); }

    return req.user.follow(profileId).then(function(){
      return res.json({profile: req.profile.toProfileJSONFor(user)});
    });
});

router.delete('/:username/follow', isAuth, function(req, res, next){
  var profileId = req.profile._id;


    if (!req.user) { return res.sendStatus(401); }

    return req.user.unfollow(profileId).then(function(){
      return res.json({profile: req.profile.toProfileJSONFor(user)});
    });
});

module.exports = router;