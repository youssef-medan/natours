const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const APIfeatures = require('./../Utils/apIfeatures');
const AppError = require('./../Utils/appError');
const factory = require('./../controllers/handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('not an image', 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

// upload.single('image') req.file
// upload.array('images',5) req.files

exports.resizeTourImages = async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const fileName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${fileName}`);

      req.body.images.push(fileName);
    })
  );

  next();
};

// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
//   );

// exports.checkBody = ((req, res, next) => {
//   if (!req.body.name || !req.body.price) return res.status(400).json({status:"fail",message:"name or price is missing"});
//   next();
// })

exports.topFiveTours = (req, res, next) => {
  req.query.sort = '-ratingsAverage,price';
  req.query.limit = '5';
  req.query.fields = 'name,price,ratingsAverage,difficulty';
  next();
};

// console.log(req.query,queryObj)
// const tours = await Tour.find({duration:5,difficulty:'easy'});
// const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy');

//-----copy req.query to queryObj then exclude this fields from it-----

// queryObj = {...req.query}
// excludedFields = ['page','sort','limit','fields']
// excludedFields.forEach(el => delete queryObj[el]) ;

//-----find by >= , <=  ------

// let queryStr = JSON.stringify(queryObj)
// queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g , match => `$${match}`)
// let query =  Tour.find(JSON.parse(queryStr));
//sort query

// if(req.query.sort){
//   const sortBy = req.query.sort.split(',').join(' ')
//   query.sort(sortBy)
// }else{
//   query.sort('-createdAt')
// }
//query fields

// if(req.query.fields){
//   const fields = req.query.fields.split(',').join(' ');
//   query = query.select(fields)
// }else{
//   query = query.select('-__v')
// }

//paginate
// const page = req.query.page * 1 || 1
// const limit = req.query.limit * 1 || 100
// const skip = (page - 1) * limit
// query = query.skip(skip).limit(limit)

// if(req.query.page){
//   const numTours = await Tour.countDocuments()
//   if(skip >= numTours) throw new Error('this page not exist')
// }
exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updataOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getToursWithIn = async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng)
    return next(
      new AppError(
        'please provide a latitude and longitude in the format lat:lng',
        400
      )
    );
  console.log(distance, lat, lng, unit);
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  console.log(radius);

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
};

exports.getDistances = async (req, res, next) => {
  try {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    if (!lat || !lng)
      return next(
        new AppError(
          'please provide a latitude and longitude in the format lat:lng',
          400
        )
      );

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng * 1, lat * 1],
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier,
        },
      },
      {
        $project: {
          distance: 1,
          name: 1,
          price: 1,
          difficulty: 1,
          ratingsAverage: 1,
          ratingsQuantity: 1,
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      results: distances.length,
      data: {
        data: distances,
      },
    });
  } catch (error) {
    next(error);
  }
};
exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 2.5 } },
      },
      {
        $group: {
          _id: '$difficulty',
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
      // {
      //   $match: { _id: { $ne: 'easy' } },
      // },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-1-1`),
            $lte: new Date(`${year}-12-24`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: { _id: 0 },
      },
      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};
