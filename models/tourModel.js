const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');
const { promises } = require('nodemailer/lib/xoauth2');
const Schema = mongoose.Schema;
const tourSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      unique: true,
      minLength: [10, 'a tour must have more than 10 characters'],
      maxLength: [40, 'a tour must have less than 40 characters'],
      // validate : [validator.isAlpha,'tour name must only contain characters']
    },
    slug: String,
    duration: { type: Number, required: [true, 'durations is required'] },
    maxGroupSize: {
      type: Number,
      required: [true, 'maxGroupSize is required'],
    },
    difficulty: {
       type: String,
       required: [true, 'diffculty is required'],
       enum: {
        values: ['easy','medium','difficult'],
        message: 'diffculty is either: easy,medium,difficult',
       }

        },
    // rating: { type: Number, default: 4.5 },
    ratingsAverage: { 
      type: Number,
      default: 4.5,
      min : [1,'minimum rating must be above 1'],
      max : [5,'minimum rating must be below 5'],
      set:val => Math.round(val),
       },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'price is required'] },
    priceDiscount: {
      type : Number,
      validate : {
        validator : function(val){
          return val <= this.price; //this custom validateor only work when you create bnew doucment (not work when updating)
        },
        message : 'discount price({VALUE}) must be below to regular price'

      } 
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'summery is required'],
    },
    description: { type: String, trim: true },
    imageCover: { type: String, required: [true, 'image cover is required'] },
    images: [String],
    createdAt: { type: Date, default: Date.now() },
    startDates: [Date],
    secretTour: { type: Boolean, default: false },

    startLocation:{
      type:{
        type : String,
        default : 'Point',
        enum:['Point']
      },
      coordinates:[Number],
      address : String,
      description : String
    },
    locations:[
      {
        type:{
          type : String,
          default : 'Point',
          enum:['Point']
        },
        coordinates:[Number],
        address : String,
        description : String,
        day:Number,
      }
    ],
    guides:[
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        // required: [true, 'tour must have a guide'],
      },
    ],
    
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// tourSchema.index({price:1})
tourSchema.index({slug:1})
tourSchema.index({price:1,ratingsAverage:-1})
tourSchema.index({startLocation:'2dsphere'})


//this virtual is like option data work when you get data from database but it's not acutally saved in database
tourSchema.virtual('reviews',{
  ref: 'Review',
  foreignField:'tour',
  localField:'_id',
})
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//--------------------------document middeeware------------------------------

// this middleware work before data saved in database (save is working with save model or create model)
tourSchema.pre('save', function (next) {
  // return(this) --its return the model what is about to be saved--
  this.slug = slugify(this.name, { lower: true });
  next();
});
// tourSchema.pre('save', async function (next) { // embedding user
//  const guidesPromises = this.guides.map(async id => await User.findById(id)) 
//  this.guides = await Promise.all(guidesPromises)
//   next();
// });



//this middleware triggerd after all pre middlewares & it's have access on saved model(doc)
tourSchema.post('save', function (doc, next) {
  // console.log(doc)
  next();
});

//------------------------------query middleware---------------------------

//this middleware trigger before any find query so you can filter any find method before it's triggerd

// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  //  /^find/ so we can aplly this to any query start with (find) so we can apply this in find and findOne not only find
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});
tourSchema.pre(/^find/, function (next) {
  this.populate({path:'guides',select:'-passwordChangedAt -__v'})
  next();
});

//this middleware triggerd after query excuted & it's have access to docs in the query
tourSchema.post(/^find/, function (docs, next) {
  console.log(`this query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs)
  next();
});

//--------------------------aggregation middeeware------------------------------

//this middeware edit aggregate before it excuteed so we remove secret tour from aggregate in this fuction
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); //unshift is a javascript function to add to the top of array(shift to add in the bottom of array)
//   // console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
