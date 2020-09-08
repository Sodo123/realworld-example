var router = require('express').Router();
var user_controller = require('../../controllers/userController');

router.get('/', user_controller.get_user);
router.put('/', user_controller.edit_user);
router.post('/register', user_controller.register_user);
router.get('/login', user_controller.login);
router.post('/login', user_controller.do_login);

module.exports = router;