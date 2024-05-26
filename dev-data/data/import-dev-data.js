const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE;

mongoose.connect(DB, {}).then(() => {
  console.log('conected successfully');
});

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users,{validateBeforeSave: false});
    await Review.create(reviews);
    console.log('success');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

const deleteData = async () => {
  try {
   await Tour.deleteMany();
   await User.deleteMany();
   await Review.deleteMany();
    console.log('successfuly deleted');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};
if (process.argv[2] === '--import') {
    importData()
}else if (process.argv[2] === '--delete'){
    deleteData()
}
console.log(process.argv)
