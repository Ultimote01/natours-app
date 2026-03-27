const Booking = require("../models/bookingModel");
const Review = require("../models/reviewModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { deleteOne, updateOne, createOne, getAll } = require("./handleFactory");


exports.infoProcessReview = (req, res, next) => {
  const { review, rating, createdAt } = req.body;
  const tour = req.body.tour ? req.body.tour : req.params.tourId;
  const user = req.body.user ? req.body.user : req.user._id;
  const tourId = tour;
  req.body = {
    review,
    rating,
    createdAt,
    tour: tourId,
    user
  };
};

exports.validateBookings = catchAsync( async (req, res, next)=> {
  console.log(req.body.tour);
  const booking = await Booking.findOne({user : req.body.user,tour: req.body.tour});
  
  console.log("ValidateBooking: ", booking)
  if (booking === null ) next( new AppError("User must book a tour to write a review", 403));
  
  next();
});

exports.getReviews = getAll(Review);
exports.createReview = createOne(Review);
exports.updateReview = updateOne(Review);
exports.deleteReview = deleteOne(Review);
