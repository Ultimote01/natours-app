const express = require("express");

const reviewRouter = require("./../../routes/reviews/reviewRoutes");
const bookinngRouter = require("./../../routes/bookings/bookingRoutes");
 
const {
  getAllTours,
  createTour,
  updateTour,
  deleteTour,
  getTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadUserPhoto,
  resizeUserPhoto
} = require("../../controllers/tourController");
const { protect, restrictTo } = require("../../controllers/authController");
 

const router = express.Router();
// we can use the next code to check the param value and sent bacl a response
// router.param("parameter name", callback function)

//we implemented a nested route with express middleware
//This nested route is to get all reviews with the tourId 
router.use("/:tourId/reviews", reviewRouter);

//This nested route is to get all bookings with the tourId 
router.use("/:tourId/bookings", bookinngRouter);

router.route("/top-5-cheap").get(aliasTopTours, getAllTours);

router.route("/tour-stats").get(getTourStats);
router
  .route("/monthly-plan/:id")
  .get(protect, restrictTo("admin", "lead-guide", "lead"), getMonthlyPlan);

// GeoSpatial within  Route
// This allows us to get the tours with a given lng,lat and radius if $geoWithin operator was used
// /tours-within/200/center/34.055447989191826,-118.23499797210083/unit/mi
router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(getToursWithin);

// GeoSpatial aggragation pipeline route
// This allows us to get the distance within
router.route("/distances/:latlng/unit/:unit").get(getDistances);

router
  .route("/")
  .get(getAllTours)
  .post(protect, restrictTo("admin", "lead-guide"), createTour);

router
  .route("/:id")
  .get(getTour)
  .patch(protect, restrictTo("admin", "lead-guide"), uploadUserPhoto, resizeUserPhoto, updateTour)
  .delete(protect, restrictTo("admin", "lead-guide"), deleteTour);

module.exports = router;
