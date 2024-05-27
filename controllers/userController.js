const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const AppError = require('./../Utils/appError.js');
const factory = require('./../controllers/handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users')
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('not an image', 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
    next()
};

const filterdObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = async (req, res, next) => {
  try {
    if (req.body.password || req.body.passwordConfirm)
      return next(
        new AppError(
          'this route not for update password , please user /updatepassword',
          400
        )
      );
    const filterdBody = filterdObj(req.body, 'name', 'email');
    if (req.file) filterdBody.photo = req.file.filename;

    const updateUser = await User.findByIdAndUpdate(req.user.id, filterdBody, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      message: 'updated successfully',
      date: {
        updateUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
      status: 'success',
      message: 'null',
    });
  } catch (error) {}
};

exports.createUser = (req, res) => {
  res.status(500).json({
    message: 'user sign ic to create user',
  });
};
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updataOne(User);
exports.deleteUser = factory.deleteOne(User);
