const express = require('express');
const reviewController = require('.././controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.isLoggedIn,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.isMyBookedTour,
    reviewController.createReview
  );
router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(authController.restrictTo('user'), reviewController.updateReview)
  .delete(authController.restrictTo('user'), reviewController.deleteReview);

module.exports = router;
