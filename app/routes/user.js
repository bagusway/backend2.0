var express = require('express');
var userController = require('../controllers/userController');
var userRouter = express.Router();
var passport = require('passport');
var passportConfig = require('../passport/passport');
var { secret } = require('../config/index');
var jwt = require('jsonwebtoken');

//setup configuration for facebook login
passportConfig();

userRouter.route('/auth/facebook')
    .post(passport.authenticate('facebook-token', { session: false }), function(req, res) {
        if (!req.user) {
            res.send({ status: 404, success: false, message: 'User not found!' });
        } else if (req.user.flag_register === 1) {
            res.json({ status: 400, success: false, message: 'Email has been registered!' })
        } else {
            var token = jwt.sign({ login_type: 1, id: req.user._id, id_user: req.user.id_user, name: req.user.name, email: req.user.email, role: req.user.role }, secret, { expiresIn: '24h' });
            res.json({ status: 200, success: true, message: 'User authenticated!', token: token, name: req.user.name, email: req.user.email, photo: req.user.photo, telephone: req.user.telephone, role: req.user.role });

        }
    });

userRouter.route('/auth/google/token')
    .post(passport.authenticate('google-token'), function(req, res) {
        if (!req.user) {
            res.send({ status: 404, success: false, message: 'User not found!' });
        } else if (req.user.flag_register === 1) {
            res.json({ status: 400, success: false, message: 'Email has been registered!' })
        } else {
            var token = jwt.sign({ login_type: 1, id: req.user._id, id_user: req.user.id_user, name: req.user.name, email: req.user.email, role: req.user.role }, secret, { expiresIn: '24h' });
            res.json({ status: 200, success: true, message: 'User authenticated!', token: token, name: req.user.name, email: req.user.email, photo: req.user.photo, telephone: req.user.telephone, role: req.user.role });
        }
        // console.log(req.user);
    });

userRouter.route('/users')
    .post(userController.register);

userRouter.route('/checkemail')
    .post(userController.checkEmail);

userRouter.route('/authenticate')
    .post(userController.authenticate);

userRouter.route('/authenticate_admin')
    .post(userController.authenticateAdmin);

userRouter.route('/activate/:token')
    .put(userController.activate);

userRouter.route('/forgot_password')
    .put(userController.forgot);

userRouter.route('/forgot_password/:token')
    .get(userController.getForgotPassword);

userRouter.route('/save_password')
    .put(userController.save);

module.exports = userRouter;