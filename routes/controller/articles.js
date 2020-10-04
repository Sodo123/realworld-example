var router = require('express').Router();
var mongoose = require('mongoose');
const { isArguments } = require('underscore');
var User = mongoose.model('User');
var Comment = mongoose.model('Comment');
var Article = mongoose.model('Article');

const isAuth = require('../authMiddleware').isAuth;
const isAdmin = require('../authMiddleware').isAdmin;

// Preload article objects on routes with ':article'
router.param('article', function(req, res, next, slug) {
    Article.findOne({ slug: slug})
      .populate('author')
      .then(function (article) {
        if (!article) { return res.sendStatus(404); }
  
        req.article = article;
  
        return next();
      }).catch(next);
  });
  
  router.param('comment', function(req, res, next, id) {
    Comment.findById(id).then(function(comment){
      if(!comment) { return res.sendStatus(404); }
  
      req.comment = comment;
  
      return next();
    }).catch(next);
  });
  
  router.get('/', function(req, res, next) {
    var query = {};
    var limit = 20;
    var offset = 0;
  
    if(typeof req.query.limit !== 'undefined'){
      limit = req.query.limit;
    }
  
    if(typeof req.query.offset !== 'undefined'){
      offset = req.query.offset;
    }
  
    if( typeof req.query.tag !== 'undefined' ){
      query.tagList = {"$in" : [req.query.tag]};
    }
  
    Promise.all([
      req.query.author ? User.findOne({username: req.query.author}) : null,
      req.query.favorited ? User.findOne({username: req.query.favorited}) : null
    ]).then(function(results){
      var author = results[0];
      var favoriter = results[1];
  
      if(author){
        query.author = author._id;
      }
  
      if(favoriter){
        query._id = {$in: favoriter.favorites};
      } else if(req.query.favorited){
        query._id = {$in: []};
      }
  
      return Promise.all([
        Article.find(query)
          .limit(Number(limit))
          .skip(Number(offset))
          .sort({createdAt: 'desc'})
          .populate('author')
          .exec(),
        Article.count(query).exec(),
        req.payload ? User.findById(req.payload.id) : null,
      ]).then(function(results){
        var articles = results[0];
        var user = results[2];
  
        return    res.render('./articles/index',
          {articles: articles.map(function(article){
            return article.toJSONFor(user);
          }),
          moment: require('moment')},
        );
      });
    }).catch(next);
  });
  
  router.get('/feed', isAuth, function(req, res, next) {
    var limit = 20;
    var offset = 0;
  
    if(typeof req.query.limit !== 'undefined'){
      limit = req.query.limit;
    }
  
    if(typeof req.query.offset !== 'undefined'){
      offset = req.query.offset;
    }
  

      if (!req.user) { return res.sendStatus(401); }
  
      Promise.all([
        Article.find({ author: {$in: req.user.following}})
          .limit(Number(limit))
          .skip(Number(offset))
          .populate('author')
          .exec(),
        Article.count({ author: {$in: req.user.following}})
      ]).then(function(results){
        var articles = results[0];
        var articlesCount = results[1];
  
        return  res.render('./articles/index',
          {articles: articles.map(function(article){
            return article.toJSONFor(req.user);
          })},
        );
      }).catch(next);

  });
  
  router.post('/', isAuth, function(req, res, next) {
    User.findById(req.payload.id).then(function(user){
      if (!user) { return res.sendStatus(401); }
  
      var article = new Article(req.body.article);
  
      article.author = user;
  
      return article.save().then(function(){
        console.log(article.author);
        return res.json({article: article.toJSONFor(user)});
      });
    }).catch(next);
  });
  
  // return a article
  
  router.get('/:article', function(req, res, next) {
    console.log('author ', req.article.author._id);
    const isFollowing = typeof(req.user) !== "undefined" ? req.user.isFollowing(req.article.author._id) : false;
    Promise.all([
      req.article.populate('author').populate('comments').execPopulate()
    ]).then(async function(results){
      const authorsIds = req.article.comments.map( cmt => cmt.author);
      const authors = await User.find({ _id : { $in : authorsIds} }, 'username image');
      const authorObject = authors.reduce((obj, author) => {
        const authorId = author._id.toString();
        obj[authorId] = author;
        return obj;
      },{});
      
      const comments = req.article.comments.map( cmt => {
        cmt.author = authorObject[cmt.author];
        return cmt;
      });
      req.article.comments = comments;
      return  res.render('./articles/detail',
                {article: req.article,
                moment: require('moment'),
                isAuthenticated : req.isAuthenticated(),
                isFollowing: isFollowing
                },
                );
    }).catch(next);
  });
  
  // update article
  router.put('/:article', isAuth, function(req, res, next) {
    User.findById(req.payload.id).then(function(user){
      if(req.article.author._id.toString() === req.payload.id.toString()){
        if(typeof req.body.article.title !== 'undefined'){
          req.article.title = req.body.article.title;
        }
  
        if(typeof req.body.article.description !== 'undefined'){
          req.article.description = req.body.article.description;
        }
  
        if(typeof req.body.article.body !== 'undefined'){
          req.article.body = req.body.article.body;
        }
  
        if(typeof req.body.article.tagList !== 'undefined'){
          req.article.tagList = req.body.article.tagList
        }
  
        req.article.save().then(function(article){
          return res.json({article: article.toJSONFor(user)});
        }).catch(next);
      } else {
        return res.sendStatus(403);
      }
    });
  });
  
  // delete article
  router.delete('/:article', isAuth, function(req, res, next) {
    User.findById(req.payload.id).then(function(user){
      if (!user) { return res.sendStatus(401); }
  
      if(req.article.author._id.toString() === req.payload.id.toString()){
        return req.article.remove().then(function(){
          return res.sendStatus(204);
        });
      } else {
        return res.sendStatus(403);
      }
    }).catch(next);
  });
  
  // Favorite an article
  router.post('/:article/favorite', isAuth, function(req, res, next) {
    var articleId = req.article._id;
  
    User.findById(req.payload.id).then(function(user){
      if (!user) { return res.sendStatus(401); }
  
      return user.favorite(articleId).then(function(){
        return req.article.updateFavoriteCount().then(function(article){
          return res.json({article: article.toJSONFor(user)});
        });
      });
    }).catch(next);
  });
  
  // Unfavorite an article
  router.delete('/:article/favorite', isAuth, function(req, res, next) {
    var articleId = req.article._id;
  
    User.findById(req.payload.id).then(function (user){
      if (!user) { return res.sendStatus(401); }
  
      return user.unfavorite(articleId).then(function(){
        return req.article.updateFavoriteCount().then(function(article){
          return res.json({article: article.toJSONFor(user)});
        });
      });
    }).catch(next);
  });
  
  // return an article's comments
  router.get('/:article/comments', function(req, res, next){

      return req.article.populate({
        path: 'comments',
        populate: {
          path: 'author'
        },
        options: {
          sort: {
            createdAt: 'desc'
          }
        }
      }).execPopulate().then(function(article) {
        return res.json({comments: req.article.comments.map(function(comment){
          return comment.toJSONFor(req.user);
        })});
      });
  });
  
  // create a new comment
  router.post('/:article/comments', isAuth, function(req, res, next) {

      if(!req.user){ return res.sendStatus(401); }
  
      var comment = new Comment({"body": req.body.comment});
      comment.article = req.article;
      comment.author = req.user;
  
      return comment.save().then(function(){
        req.article.comments.unshift(comment);
  
        return req.article.save().then(function(article) {
          res.redirect('/articles/' + req.article.slug );
          //res.json({comment: comment.toJSONFor(user)});
        });
      });
    ;
  });
  
  router.delete('/:article/comments/:comment', isAuth, function(req, res, next) {
    if(req.comment.author.toString() === req.payload.id.toString()){
      req.article.comments.remove(req.comment._id);
      req.article.save()
        .then(Comment.find({_id: req.comment._id}).remove().exec())
        .then(function(){
          res.sendStatus(204);
        });
    } else {
      res.sendStatus(403);
    }
  });
  
  module.exports = router;