var express = require('express');
var paymentController = require('../controllers/paymentController');
var paymentRouter = express.Router();

paymentRouter.route('/add/:id')
    .post(paymentController.addBilling);

// userRouter.route('/users')
//     .post(userController.register); 

// userRouter.route('/checkemail')
//     .post(userController.checkEmail);  

// userRouter.route('/authenticate')
//     .post(userController.authenticate);  

// userRouter.route('/activate/:token')
//     .put(userController.activate);  

// userRouter.route('/forgot_password')
//     .put(userController.forgot);  

// userRouter.route('/forgot_password/:token')
//     .get(userController.getForgotPassword);  

// userRouter.route('/save_password')
//     .put(userController.save);  

module.exports = paymentRouter;