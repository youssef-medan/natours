const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const reviewSchema = new Schema(
  {
    review: {
      type: String,
      required: [true, 'your review can not be empty '],
      minLength: [5, 'review must have more than 5 characters'],
      maxLength: [300, 'review must have less than 300 characters'],
    },
    rating: {
      type: Number,
      required: [true, 'your rating can not be empty '],
      min: [1, 'rating must be at least 1'],
      max: [5, 'rating must be at most 10'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'review must belong to a user'],
    },

    tour: {
      type: Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'review must belong to a tour'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({tour:1,user:1},{unique:true})

reviewSchema.pre(/^find/, function (next) {
    // this.populate({path:'tour',select:'name difficulty rating'})
    this.populate({path:'user',select:'name photo'})
    next();
  });

  reviewSchema.statics.calcAverageRating = async function(tourId){
    const stats = await this.aggregate([
      {
        $match: { tour: tourId }
      },
      {
        $group: {
          _id: '$tour',
          nRating: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ])

    if (stats.length > 0) {
      await Tour.findByIdAndUpdate(tourId, {
        ratingsAverage: stats[0].avgRating,
        ratingsQuantity: stats[0].nRating
      })
      
    } else {
      await Tour.findByIdAndUpdate(tourId, {
        ratingsAverage: 4.5,
        ratingsQuantity: 0
      })
    }
  }

  reviewSchema.post('save', function () {
    this.constructor.calcAverageRating(this.tour);
  });
  reviewSchema.pre(/^findOneAnd/,async function (next) {
    this.r = await this.findOne();
    next();
  })

  reviewSchema.post(/^findOneAnd/, async function () {
    await this.r.constructor.calcAverageRating(this.r.tour);
  });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
