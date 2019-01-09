var express = require('express');
var otomatisasiRouter = express.Router();
var otomatisasiController = require('../controllers/otomatisasiController');

otomatisasiRouter.route('/check_valid_trip')
    .get(otomatisasiController.getValidTrips);

otomatisasiRouter.route('/check_expire_booking')
    .get(otomatisasiController.checkexpireBooking);

otomatisasiRouter.route('/reminder_trip')
    .get(otomatisasiController.reminderTrip);

otomatisasiRouter.route('/reminder_trip_day')
    .get(otomatisasiController.reminderTripday);

otomatisasiRouter.route('/data_peserta')
    .get(otomatisasiController.sendUnduhdatapeserta);

otomatisasiRouter.route('/confirmation_mepo')
    .get(otomatisasiController.confirmationMepo);

otomatisasiRouter.route('/reminder_review')
    .get(otomatisasiController.reminderReviewandRating);


module.exports = otomatisasiRouter;