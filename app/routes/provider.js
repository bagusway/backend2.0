var express = require('express');
var providerController = require('../controllers/providerController');
var providerRouter = express.Router();

providerRouter.route('/add_trip')
    .post(providerController.addTrip);

providerRouter.route('/profile')
    .get(providerController.getProfileProvider);

providerRouter.route('/profile')
    .put(providerController.editProfileProvider);

providerRouter.route('/edit_cover')
    .put(providerController.editCoverProvider);

providerRouter.route('/edit_logo')
    .put(providerController.editLogoProvider);

providerRouter.route('/edit_trip/detail/:id')
    .get(providerController.getDetailEditTrip);

providerRouter.route('/edit_trip/:id')
    .put(providerController.editTrip);

providerRouter.route('/edit_photo_trip/:id')
    .put(providerController.editPhotoTrip);

providerRouter.route('/delete_trip/:id')
    .post(providerController.deleteTrip);

providerRouter.route('/all_trip')
    .get(providerController.getAllTrip);

providerRouter.route('/valid_trip')
    .get(providerController.getAllValidTrips);

providerRouter.route('/notvalid_trip')
    .get(providerController.getAllNotValidTrips);

providerRouter.route('/transaction_trip')
    .get(providerController.salesTransactionProvider);

providerRouter.route('/detail_transaction/:id_trip')
    .get(providerController.detailSalesTransaction);

providerRouter.route('/detail_transaction_by_date/:id_trip/:startDate_trip')
    .get(providerController.detailSalesTransactionbydate);

providerRouter.route('/confirm_transaction')
    .put(providerController.cnfrmtripbyProvider);

providerRouter.route('/withdraw')
    .post(providerController.withdrawProvider);

providerRouter.route('/balance')
    .get(providerController.providerBalance);

providerRouter.route('/discountby_provider/:id')
    .put(providerController.discountbyProvider);

providerRouter.route('/quota_null/:id')
    .put(providerController.setquoatanullbyProvider);

providerRouter.route('/detail_transaction_traveller/:id_trip/:date')
    .post(providerController.pdfdetailTransactionTraveller);

module.exports = providerRouter;