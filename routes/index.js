var router = require('express').Router();

//router.use('/api', require('./api'));
router.use('/', require('./controller'));

module.exports = router;
