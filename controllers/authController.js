const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const AppError = require('./../Utils/appError.js');
const { promisify } = require('util');
const Email = require('./../Utils/email');
require('dotenv').config(); // Load environment variables from .env file
const crypto = require('crypto');

const userToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

cookieOptions = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  ),

  //  secure:true,
  httpOnly: true,
};

if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
    });

    const url = `${req.protocol}://${req.get('host')}/me`;

    await new Email(newUser,url).sendWelcome()

    const token = userToken(newUser._id);

    res.cookie('jwt', token, cookieOptions);

    newUser.password = undefined;

    res.status(201).json({
      message: 'success',
      token,
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.checkPassword(password, user.password))) {
      next(new AppError('Incorrect email or password !', 401));
    }

    const token = userToken(user._id);
    res.cookie('jwt', token, cookieOptions);
    req.cookies.jwt =token

    user.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 100 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
    data: null,
  });
};

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    // console.log(token)
    if (!token) {
      return next(new AppError('please login to get access', 401));
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // console.log(decoded)

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(
        new AppError(
          'the user belonging to this token does no longer exist',
          401
        )
      );
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          'User recently changed password! Please log in again.',
          401
        )
      );
    }

    req.user = user;
    res.locals.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // console.log(decoded)

      const user = await User.findById(decoded.id);
      if (!user) {
        return next();
      }

      if (user.changedPasswordAfter(decoded.iat)) {
        return next();
      }
    res.locals.user = user;
    req.user = user;

    }
    

    const user = await User.findById('664c71bce3d5256d514c80cd');
    if(!user) {console.log("User not found")}
    res.locals.user = user;
    req.user = user;

    // res.cookie('yyy','ffff')
    return next();
  } catch (error) {
    next();
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

// exports.forgotPassword = async (req, res, next) => {

//     const user = await User.findOne({ email: req.body.email });
//     if (!user) return next(new AppError('there is no user with email address'));

//     const resetToken = user.createPasswordResetToken();

//     const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetpassword/${resetToken}`;

//     const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email!`;

//     try{

//       await sendEmail({email:user.email, subject:'your reset password token available for 10 min', message:message})

//       res.status(200).json({
//         status:'success',
//         message: 'token sent to email',
//       });

//   }catch (error) {
//      user.passwordResetExpires = null;
//      user.passwordResetToken = null;
//     await user.save({validateBeforeSave:false});
//     next(new AppError('there was an error sending the email try again later ',500))
//     // next(error);
//   }
// }

exports.forgotPassword = async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    //   name: user.name,
    // });

    await new Email(user,resetURL).sendPaaswordReset()

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      return next(new AppError('token is expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = userToken(user._id);

    res.cookie('jwt', token, cookieOptions);
    res.status(200).json({
      status: 'success',
      token,
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    console.log(req.user)
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return next(new AppError('please login to get access', 401));
    }
    if (!(await user.checkPassword(req.body.passwordCurrent, user.password))) {
      return next(new AppError('incorrect password', 401));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    console.log('aaaaaaaaa')

    token = userToken(user._id);

    res.cookie('jwt', token, cookieOptions);
    res.status(200).json({
      status: 'success',
      token,
    });
  } catch (error) {
    next(error);
  }
};
