const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE;
 
// process.on('uncaughtException', (err) => {
//   console.log(err.name, err.message);

//   process.exit(1);
// });


mongoose
  .connect(DB, {
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
    // useUnifiedTopology: true
  })
  .then(() => {
    console.log('conected successfully');
  });

// const newTour = new Tour({
//   name:'the forest hiker 3',
//   price: 500,
//   rating: 4.7,
// })
// newTour.save().then((doc) => {console.log(doc)}).catch((err) => {console.log(err)})

const app = require('./app');
const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// process.on('unhandledRejection', (err) => {
//   console.log(err.name, err.message);
//   server.close(() => {
//     process.exit(1);
//   });
// });

