var router = require('express').Router();

router.use('/user', require('./users'));
router.use('/profiles', require('./profiles'));
router.use('/articles', require('./articles'));

module.exports = router;