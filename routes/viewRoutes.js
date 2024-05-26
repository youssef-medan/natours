const express = require('express');
const authController = require('./../controllers/authController')
const bookingController = require('./../controllers/bookingController');


const viewController = require('./../controllers/viewController');
const router = express.Router();

router.use(authController.isLoggedIn)
router.get('/',bookingController.createBookingCheckout,viewController.getOverview);
router.get('/tour/:slug', viewController.getTour);
router.get('/login',viewController.getLoginForm);
router.get('/me',viewController.getAccount);
router.get('/my-tours', viewController.getMyTours)
router.post('/submit-user-data',viewController.updateUserData)

module.exports = router;
