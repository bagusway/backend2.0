var express = require('express');
var bookingController = require('../controllers/bookingController');
var bookingRouter = express.Router();

bookingRouter.route('/add')
    .post(bookingController.addBooking);

bookingRouter.route('/add_detail')
    .put(bookingController.postDetailbooking);

bookingRouter.route('/add_payment')
    .put(bookingController.addPaymentbooking);

bookingRouter.route('/update_status')
    .put(bookingController.updateStatuspayment);

bookingRouter.route('/add_traveller_detail')
    .put(bookingController.addTravellerdetail);

bookingRouter.route('/check_promo')
    .post(bookingController.checkPromo);

bookingRouter.route('/eticket/:_id')
    .post(bookingController.geteTicketTraveller);

bookingRouter.route('/booking_confirmation_mepo')
    .put(bookingController.confirmationBookMepo);

bookingRouter.route('/booking_user')
    .get(bookingController.getBookinguser);

bookingRouter.route('/detail/:id_booking')
    .get(bookingController.getDetailBooking);

bookingRouter.route('/history')
    .get(bookingController.getHistorybooking);

bookingRouter.route('/delete')
    .post(bookingController.deleteFinishedbooking);

bookingRouter.route('/detail_payment/:id')
    .get(bookingController.getDetailPayment);

module.exports = bookingRouter;