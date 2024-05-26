const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const APIfeatures = require('./../Utils/apIfeatures');
const AppError = require('./../Utils/appError');
const factory = require('./../controllers/handlerFactory');

exports.getTourBookings = async (req, res, next) => {
  try {
    if (req.params.tourId) {
      factory.getAll(Booking.find({ tour: req.params.tourId }));
    }
    next();
  } catch (error) {
    next(error);
  }
};

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updataOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

exports.getCheckoutSession = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.tourId);
    if (!tour) {
      return next(new AppError('there is no tour whith that name', 404));
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      success_url: `${req.protocol}://${req.get('host')}/?tour=${
        req.params.tourId
      }&user=${req.user.id}&price=${tour.price}`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourId,
      mode: 'payment',

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: tour.price * 100,
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            },
          },
        },
      ],
    });

    res.status(200).json({
      status: 'success',
      session,
    });
  } catch (error) {
    next(error);
  }
};

exports.createBookingCheckout = async (req, res, next) => {
  try {
    const { tour, user, price } = req.query;
    if (!tour && !user && !price) return next();
    await Booking.create({ user, tour, price });
    res.redirect(`${req.protocol}://${req.get('host')}/`);
  } catch (error) {
    next(error);
  }
};
