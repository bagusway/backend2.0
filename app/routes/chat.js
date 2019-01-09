var express = require('express');
var chatController = require('../controllers/chatController');
var chatRouter = express.Router();


chatRouter.route('/:id')
    .get(chatController.getRoom);

chatRouter.route('/create')
    .post(chatController.createChat);

module.exports = chatRouter;