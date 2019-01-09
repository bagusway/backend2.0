var express = require('express');
var discussionController = require('../controllers/discussionController');
var discussionRouter = express.Router();

discussionRouter.route('/post/:id_trip')
    .post(discussionController.postDiscussion);

discussionRouter.route('/edit/:id')
    .put(discussionController.editDiscussion);

discussionRouter.route('/delete/:id')
    .post(discussionController.deleteDiscussion);

discussionRouter.route('/trip_discussion/:id')
    .get(discussionController.getAllDiscussion);

discussionRouter.route('/post_comment/:id')
    .post(discussionController.postComment);

discussionRouter.route('/edit_comment/:id')
    .put(discussionController.editComment);

discussionRouter.route('/delete_comment/:id_discussion/:id')
    .post(discussionController.deleteComment);

discussionRouter.route('/trip_comment/:id')
    .get(discussionController.getCommentDiscussion);

discussionRouter.route('/user')
    .get(discussionController.getDiscussionUser);

discussionRouter.route('/provider')
    .get(discussionController.getDiscussionProvider);

module.exports = discussionRouter;