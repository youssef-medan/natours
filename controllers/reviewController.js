const AppError = require('.././Utils/appError');
const Review = require('.././models/reviewModel');
const Booking = require('.././models/bookingModel');
const APIfeatures = require('./../Utils/apIfeatures');
const factory = require('./../controllers/handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
exports.isMyBookedTour = async (req, res, next) => {
  const booked = await Booking.findOne({
    tour: req.params.tourId,
    user: req.user.id,
  });
  if (!booked) return next(new AppError('You must book this tour before review it', 401));
  next();
};
exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updataOne(Review);
exports.deleteReview = factory.deleteOne(Review);
