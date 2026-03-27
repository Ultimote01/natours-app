const path = require("path");

const express = require("express");
const morgan = require("morgan");
const { rateLimit } = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const hpp = require("hpp");
const compression = require('compression');
const cookieParser = require("cookie-parser");

const AppError = require("./utils/appError");
const errorController = require("./controllers/errorController");
const tourRouter = require("./routes/tours/tourRoutes");
const userRouter = require("./routes/users/userRoutes");
const reviewRouter = require("./routes/reviews/reviewRoutes");
const viewRouter = require("./routes/views/viewRoutes");
const bookingRouter = require("./routes/bookings/bookingRoutes");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Global middleware 
// Sanitzation against nosql injection
app.use(mongoSanitize());

// Sanitization against xss attacks
app.use(xssClean());

// Set security HTTP header
app.use(helmet());

// Prevent parameter pollution
app.use(hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  }));

app.use(compression())

// Development logging
if (process.env.MODE === "dev") {
  app.use(morgan("dev"));
}

// Body parser, this allows us to use request body
app.use( (req, res, next)=>{

  if (req.originalUrl === "/webhook") return next()
  express.json({ limit: "10kb" })(req,res,next);
});

app.use(cookieParser());

// Limit request to api
const rateLimiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many request. Pleae try again in an hour"
});
app.use("/api", rateLimiter);
 
//Test middleware
app.use((req, res, next) => {
  console.log("middleware called");

  next();
});


app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

// To implement a custom 404 response, we will need to create  a handler below  our defined routes
//So if the route request doesn't match our defined routes, custom handler will catch it.

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404, false));
});

// This blocck of code is used by express to capture all possible errors
app.use(errorController);

module.exports = app;

// Debugging our program
// We would install a  node package "ndb"
//  Add to package.json script "ndb server.js"
// Set our breakpoints
