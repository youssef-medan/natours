const path = require('path');
const express = require('express');
const fs = require('fs');

const morgan = require('morgan');
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize =require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cors = require('cors');
const cookieParser = require('cookie-parser')
const AppError = require('./Utils/appError')
const globalErrorHandler = require('./controllers/errorController');
const viewRouter = require('./routes/viewRoutes')
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const { error } = require('console');
const { mongo } = require('mongoose');
const app = express();

const corsOptions ={
  origin:['http://localhost:3000','http://localhost:3000/login'], 
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200
}
app.use(cors(corsOptions));


app.set('view engine', 'pug')
app.set('views',path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public')));

console.log(process.env.NODE_ENV);

//----------global middleware-----------

//securty http headers
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       connectSrc: ["'self'", 'http://127.0.0.1:3000', 'ws://localhost:55917/']
//     }
//   }
// }))

//rate limit the number of requests for every ip address
const limter = rateLimit({
  max:100,
  windowMs: 60 * 60 * 1000,
  message:"to many request from this ip , please try again in an hour"
})
//apply this limit middleware to all routes startwith /api (so we need to use.app() to perform global middleware)
app.use('/api',limter)

app.use(express.urlencoded({ extended:true, limit:'10kb'}))
app.use(cookieParser())

//body parser , reading data from body into req.body
app.use(express.json());

//Data Sanitization against noSQL queries
app.use(mongoSanitize())
//Data Sanitization against XSS
app.use(xss())

//prevent parameter pollution
app.use(hpp({whitelist:['duration','maxGroupSize','difficulty','price','ratingsAverage']}))

//serving static files

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use((req, res, next) => {
  // console.log(req.headers);
  console.log(req.cookies);
  next();
});

//test middleware (add requestTime to every req)
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});



// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour)
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id',updateTour )
// app.delete('/api/v1/tours/:id',deleteTour)

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  //this middleware handel unhandeld routes

//  const err = new Error(`Can't find ${req.originalUrl} on this server`)
//   err.status = 'fail';
//   err.statusCode = 404;
//   next(err);


  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
// this middleware handle errors in develpment or production
app.use(globalErrorHandler);

module.exports = app;
