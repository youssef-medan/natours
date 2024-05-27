const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const { default: isEmail } = require('validator/lib/isEmail');
const crypto = require('crypto');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'username is required'],
    minLength: [5, 'username must have more than 5 characters'],
    maxLength: [30, 'username must have less than 30 characters'],
  },
  email: {
    type: String,
    required: [true, 'email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']

   
  },
  photo: {
    type: String,
    default:'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'password is required'],
    minLength: [5, 'password must have more than 5 characters'],
    maxLength: [100, 'password must have less than 30 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'password confirm is required'],
    validate: {
      //this only worn on create and save
      validator: function (el) {
        return el === this.password;
      },
      message: 'passwordConfirm does not match password',
    },
    minLength: [5, 'passwordConfirm must have more than 5 characters'],
    maxLength: [30, 'passwordConfirm must have less than 30 characters'],
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,

  active : {
    type : Boolean,
    default : true,
    select : false

  }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000;
  next()
});

userSchema.pre(/^find/, function (next) {
 this.find({active: {$ne:false}})
 next()
})

userSchema.methods.checkPassword = async function (logPassword, userPassword) {
  return await bcrypt.compare(logPassword, userPassword);
};
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
