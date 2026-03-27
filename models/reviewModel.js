const mongoose = require("mongoose");
const Tour = require("./../models/tourModel");

// 1) Create a review field
// 2) Create a rating field
// 3) Create a created at timestamp
// 4) Create a ref to tour
// 5) Create a ref to user

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      trim: true,
      required: [true, "Review must not be empty"],
      maxLength: [100, "Must not be more than 100 characters"],
      minLength: [1, "Must have a review"]
    },
    rating: {
      type: Number,
      max: [5, "Rating must not be greater than 5"],
      min: [1, "Rating must not be lesser than one"]
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must have a user "]
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must have a tour"]
    }
  },
  {
    toJson: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: "user",
    select: "name photo"
  });

  next();
});

reviewSchema.statics.calculateAvgRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" }
      }
    }
  ]);

  if (stats.length > 0) {
    console.log("Review stats: ",stats[0].avgRating,stats[0].nRating)
    await Tour.findByIdAndUpdate(tourId, {
      ratingAverage: stats[0].avgRating,
      ratingQuantity: stats[0].nRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingAverage: 4.5,
      ratingQuantity: 0
    });
  }
};

reviewSchema.post("save", function() {
  // This points to the current document
  this.constructor.calculateAvgRatings(this.tour);
});

//Indexing with argument {unique: true }
// This prevent mongoDb fron create duplicate reviews
// Which are reviews from the same users and for the tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.post(/^findOneAnd/, async function(doc) {
  /* eslint-disable-next-line no-unsafe-optional-chaining */
  const Model = this.model;
  Model.calculateAvgRatings(doc.tour);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
