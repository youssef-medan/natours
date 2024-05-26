const express = require('express');
const bookingController = require('.././controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });


router.use(authController.isLoggedIn)


router.get(
    '/checkout-session/:tourId',
    bookingController.getCheckoutSession
);
// router.get('/').get(bookingController.getTourBookings)

router.use(authController.restrictTo('admin','lead-guide'))
router
  .route('/')
  .get(bookingController.getTourBookings,bookingController.getAllBookings)
  .post(bookingController.createBooking);
router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
