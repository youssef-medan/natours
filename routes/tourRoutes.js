const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');
const bookingRouter = require('./../routes/bookingRoutes');

const router = express.Router();

// router.use('/:tourId/reviews', reviewRouter);
router.use('/:tourId/bookings', bookingRouter);

// router.param('id',tourController.checkId)
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/top-five-tours')
  .get(tourController.topFiveTours, tourController.getAllTours);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithIn);
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
// router.route('tours-within/:distance/center/:latitude/unit/:unit').get(authController.protect,authController.restrictTo('user'))

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.isLoggedIn,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

// router.route('/:tourId/reviews').post(authController.protect,authController.restrictTo('user'),reviewController.createReview)

module.exports = router;
