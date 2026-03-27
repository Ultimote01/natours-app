const express = require("express");

const { protect, restrictTo } = require("./../../controllers/authController");
const {
  createReview,
  getReviews,
  deleteReview,
  updateReview,
  validateBookings
} = require("./../../controllers/reviewController");

const router = express.Router({ mergeParams: true });

router.route("/").get(protect, getReviews);
router.route("/").post(protect, restrictTo("user"), validateBookings , createReview);
router
  .route("/:id")
  .patch(updateReview)
  .delete(deleteReview);

module.exports = router;
