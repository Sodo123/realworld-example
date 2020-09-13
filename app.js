var http = require('http'),
    path = require('path'),
    methods = require('methods'),
    express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    cors = require('cors'),
    passport = require('passport')
    errorhandler = require('errorhandler'),
    mongoose = require('mongoose');

const MongoStore = require('connect-mongo')(session);

var isProduction = process.env.NODE_ENV === 'production';

// Create global app object
var app = express();

app.use(cors());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Normal express config defaults
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(require('method-override')());
app.use(express.static(__dirname + '/public'));


if (!isProduction) {
  app.use(errorhandler());
}

var conn ;
if(isProduction){
  conn = process.env.MONGODB_URI
} else {
  conn = 'mongodb://localhost/conduit'
  mongoose.set('debug', true);
}

mongoose.connect(conn);
const connection = mongoose.createConnection(conn, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const sessionStore = new MongoStore({ mongooseConnection: connection, collection: 'sessions' });

app.use(session({ 
  secret: 'conduit', 
  cookie: { maxAge: 24 * 3600 * 1000 }, 
  resave: false, 
  saveUninitialized: true,
  store: sessionStore,
 }));

 var flash = require('connect-flash');
 app.use(flash());

require('./models/User');
require('./models/Article');
require('./models/Comment');
require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

app.use(require('./routes'));

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// / error handlers

// development error handler
// will print stacktrace
if (!isProduction) {
  app.use(function(err, req, res, next) {
    console.log(err.stack);

    res.status(err.status || 500);

    res.json({'errors': {
      message: err.message,
      error: err
    }});
  });
}


// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({'errors': {
    message: err.message,
    error: {}
  }});
});

// finally, let's start our server...
var server = app.listen( process.env.PORT || 3000, function(){
  console.log('Listening on port ' + server.address().port);
});
