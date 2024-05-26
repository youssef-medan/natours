const express = require('express');

const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();
router.post('/signup',authController.signup);
router.post('/login',authController.login);
router.get('/logout',authController.logout);

router.post('/forgotpassword',authController.forgotPassword);
router.patch('/resetpassword/:token',authController.resetPassword);

router.use(authController.isLoggedIn)
//any route comes after this authController.protect will apply on them


router.patch('/updateMyPassword',authController.isLoggedIn,authController.updatePassword);
router.get('/getme',userController.getMe,userController.getUser)
router.patch('/updateme',userController.uploadUserPhoto,userController.resizeUserPhoto,userController.updateMe);
router.delete('/deleteme',userController.deleteMe);


router.use(authController.restrictTo('admin'))

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
