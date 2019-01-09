var express = require('express');
var userAccessController = require('../controllers/userAccessController');
var favoriteController = require('../controllers/favoriteController');
var userAccessRouter = express.Router();

userAccessRouter.route('/profile')
    .get(userAccessController.getProfile);

userAccessRouter.route('/profile')
    .put(userAccessController.editProfile);

userAccessRouter.route('/edit_photo_profile')
    .put(userAccessController.editPhotoProfile);

userAccessRouter.route('/change_password')
    .post(userAccessController.modifyPassword);

userAccessRouter.route('/register_provider')
    .post(userAccessController.registerProvider);

userAccessRouter.route('/billing')
    .post(userAccessController.billing);

userAccessRouter.route('/addPromo')
    .post(userAccessController.addpromo);

userAccessRouter.route('/deletepromo/:id_promo')
    .post(userAccessController.deletepromo);

userAccessRouter.route('/review')
    .post(userAccessController.postReview);

userAccessRouter.route('/add_favorite')
    .post(favoriteController.addFavorite);

userAccessRouter.route('/get_all_favorite')
    .get(favoriteController.getallfavoriteUser);

userAccessRouter.route('/get_all_favorite_trip')
    .get(favoriteController.getAllfavoriteTrip);

userAccessRouter.route('/delete_favorite/:id_favorite')
    .post(favoriteController.deleteFavorite);

userAccessRouter.route('/logout')
    .get(userAccessController.userLogout);

userAccessRouter.route('/sidebar')
    .post(userAccessController.postSidebar);

userAccessRouter.route('/encode')
    .get(userAccessController.encodeImage);

module.exports = userAccessRouter;