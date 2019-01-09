var express = require('express');
var attributeController = require('../controllers/attributeController');
var attributeRouter = express.Router();

attributeRouter.route('/type/:id_type_trip')
    .get(attributeController.getType);

attributeRouter.route('/category/:category')
    .get(attributeController.getCategory);

attributeRouter.route('/province/:id_province')
    .get(attributeController.getProvince);

attributeRouter.route('/province')
    .get(attributeController.getAllProvince);

attributeRouter.route('/type')
    .get(attributeController.getAllType);

attributeRouter.route('/category')
    .get(attributeController.getAllCategory);

attributeRouter.route('/facility')
    .get(attributeController.getFacility);

attributeRouter.route('/trip')
    .get(attributeController.getAllTrip);

attributeRouter.route('/search/:category/:province')
    .get(attributeController.searchAllTrip);

attributeRouter.route('/trip/discussion/:id')
    .get(attributeController.getAllDiscussion);

attributeRouter.route('/trip/comment/:id')
    .get(attributeController.getAllCommentDiscussion);

attributeRouter.route('/trip/review/:id')
    .get(attributeController.getAllReview);

attributeRouter.route('/type_payment')
    .get(attributeController.getTypepayment);

attributeRouter.route('/type_payment_mobile')
    .get(attributeController.getTypepaymentmobile);

attributeRouter.route('/payment_method')
    .get(attributeController.getPaymentmethod);

attributeRouter.route('/status_payment')
    .get(attributeController.getStatuspayment);

attributeRouter.route('/detail_trip/:id_trip')
    .get(attributeController.getDetailTrip);

attributeRouter.route('/trip_detail/:id')
    .get(attributeController.getDetailIDTrip);

attributeRouter.route('/detail_provider_trip/:id')
    .get(attributeController.getDetailproviderTrip);

attributeRouter.route('/trip/discount')
    .get(attributeController.getTripDiscountHome);

attributeRouter.route('/trip/all_discount')
    .get(attributeController.getAllDiscountTrip);

attributeRouter.route('/trip_name(%?%search={trip_name})?')
    .get(attributeController.getTripname);

attributeRouter.route('/search_trip/:trip_name')
    .get(attributeController.searchTripbyName);

attributeRouter.route('/search_category/:id_category')
    .get(attributeController.getTripbyCategory);

attributeRouter.route('/search_advance(%?%name={name}&id_category={category}&location={province}&days={day}&id_type={type}&date={tanggal})?')
    .get(attributeController.searchAdvance);

attributeRouter.route('/etalase/provider/:id')
    .get(attributeController.getEtalaseTravel);

attributeRouter.route('/provider/:domain')
    .get(attributeController.getEtalasebydomain);

attributeRouter.route('/salin_trip/:id')
    .get(attributeController.getDetailSalinTrip);

attributeRouter.route('/promo')
    .get(attributeController.getPromo);

attributeRouter.route('/promo/detail/:id')
    .get(attributeController.getPromodetail);

attributeRouter.route('/terms_condition')
    .get(attributeController.getTermscondition);

module.exports = attributeRouter;