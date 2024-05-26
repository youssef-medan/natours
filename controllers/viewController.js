const Review = require('../models/reviewModel');
const Tour = require('./../models/tourModel');
const AppError = require('./../Utils/appError');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
exports.getOverview = async (req, res, next) => {
  try {
    const tours = await Tour.find();
    res.status(200).render('overview', { title: 'All Tours', tours });
  } catch (error) {
    next(error);
  }
};

exports.getTour = async (req, res, next) => {
  try {
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
    });
    if (!tour) {
      return next(new AppError('there is no tour whith that name', 404));
    }
    res.status(200).render('tour', { tour, title: tour.name });
  } catch (error) {
    next(error);
  }
};

exports.getLoginForm = (req, res, next) => {
  try {
    res.status(200).render('login', { title: 'Log into Your Account' });
  } catch (error) {
    next(error);
  }
};

exports.getAccount = (req, res, next) => {
  try {
    res.status(200).render('account', {
      title: 'Your Account',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserData = async (req, res, next) => {
  try {
    // console.log(req.user.name)
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: req.body.name, email: req.body.email },
      { new: true, runValidators: true }
    );
    res.status(200).render('account', {
      title: 'Your Account',
      user: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyTours = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id });
    const tourIds = bookings.map(el => el.tour.id)
    const tours = await Tour.find({ _id: { $in: tourIds } });
    res.status(200).render('overview', {
      title: 'My Tours',
      tours,
    });
  } catch (error) {
    next(error);
  }
};
