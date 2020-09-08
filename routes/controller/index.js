var router = require('express').Router();

router.use('/user', require('./users'));

module.exports = router;