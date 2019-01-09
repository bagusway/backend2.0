var express = require('express');
var adminController = require('../controllers/adminController');
var adminRouter = express.Router();

adminRouter.route('/dashboard')
    .get(adminController.dashboardAdmin);

adminRouter.route('/get/new_provider')
    .get(adminController.getAllnewProvider);

adminRouter.route('/acc_new_provider')
    .put(adminController.accProviderrequest);

adminRouter.route('/reject_provider')
    .put(adminController.rejectProviderrequest);

adminRouter.route('/get/register_provider')
    .get(adminController.getAllregProvider);

adminRouter.route('/get/block_provider')
    .get(adminController.getProviderblock);

adminRouter.route('/get/reject_provider')
    .get(adminController.getProvidereject);

adminRouter.route('/block_provider')
    .put(adminController.blockProvider);

adminRouter.route('/unblock_provider')
    .put(adminController.unblockProvider);

adminRouter.route('/get/provider_trip/:id')
    .get(adminController.getProviderTrip);

adminRouter.route('/detail_provider/:id_provider')
    .get(adminController.getDetailprovider);

adminRouter.route('/get/all_payment_booking')
    .get(adminController.allPaymentbooking);

adminRouter.route('/acc_payment_booking')
    .put(adminController.accPaymentbookinguser);

adminRouter.route('/get/detail_payment/:id_payment')
    .get(adminController.getDetailpaymentbooking);

adminRouter.route('/get/new_booking')
    .get(adminController.getAllnewBooking);

adminRouter.route('/get/ongoing_booking')
    .get(adminController.getAllongoingBooking);

adminRouter.route('/get/finished_booking')
    .get(adminController.getAllfinishedBooking);

adminRouter.route('/get/detail_booking/:id_booking')
    .get(adminController.getDetailbooking);

adminRouter.route('/update_detail_booking')
    .put(adminController.updateDetailbooking);

adminRouter.route('/dashboard_trip')
    .get(adminController.dashboardTrip);

adminRouter.route('/get/valid_trip')
    .get(adminController.getValidTrip);

adminRouter.route('/get/detail_trip/:id_trip')
    .get(adminController.getDetailTrip);

adminRouter.route('/block_trip')
    .put(adminController.blockTrip);

adminRouter.route('/unblock_trip')
    .put(adminController.unblockTrip);

adminRouter.route('/get/discussion/:id_trip')
    .get(adminController.getDiscussionTrip);

adminRouter.route('/get/review/:id_trip')
    .get(adminController.getAllReviewtrip);

adminRouter.route('/delete_discussion')
    .post(adminController.deleteDiscussion);

adminRouter.route('/delete_review')
    .post(adminController.deleteReview);

adminRouter.route('/get/req_disbursement')
    .get(adminController.getReqDisbursement);

adminRouter.route('/get/detailreq_disbursement/:id_withdraw')
    .get(adminController.detailReqDisbursement);

adminRouter.route('/acc_req_disbursement')
    .put(adminController.accReqdisbursement);

adminRouter.route('/refuse_req_disbursement')
    .put(adminController.refusereqDisbursement);

adminRouter.route('/get/history_disbursement')
    .get(adminController.getHistoryDisbursement);

adminRouter.route('/get/all_user')
    .get(adminController.getAllUser);

adminRouter.route('/get/block_user')
    .get(adminController.getListblockuser);

adminRouter.route('/block_user')
    .put(adminController.blockUser);

adminRouter.route('/unblock_user')
    .put(adminController.unblockUser);

adminRouter.route('/get/detail_user/:id_user')
    .get(adminController.getDetailUser);

adminRouter.route('/get/historyorder/:id')
    .get(adminController.getHistoryOrderuser);

adminRouter.route('/add_promo')
    .post(adminController.addPromo);

adminRouter.route('/photo_promo')
    .put(adminController.editPhotoPromo);

adminRouter.route('/get/registered_promo')
    .get(adminController.getRegisteredPromo);

adminRouter.route('/get/detail_promo/:id_promo')
    .get(adminController.getDetailPromo);

adminRouter.route('/update_detail_promo')
    .put(adminController.updateDetailPromo);

adminRouter.route('/delete_promo')
    .post(adminController.deletePromo);

module.exports = adminRouter;