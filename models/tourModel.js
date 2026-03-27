/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require("mongoose");
const slugify = require("slugify");
// const User = require("./userModel");
// const validator = require("validator");

const tourDateSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  participants: {
    type: Number,
    default: 0
  },
  soldOut: {
    type: Boolean,
    default: false
  }
});



const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      required: [true, "A tour must have a name"],
      maxlength: [40, "A tour name must have less or equal then 40 characters"],
      minlength: [10, "A tour name must have more or equal then 10 characters"]
      // validate: [validator.isAlpha]
    },
    duration: {
      type: Number,
      required: [true, "A tour must a duration"]
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"]
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "A tour must have either easy, medium, difficult"
      }
    },
    ratingAverage: {
      type: Number,
      default: 4.5,
      //min & max also works Date
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: value => Math.round(value * 10) / 10
    },
    ratingQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, "A tour must have price"]
    },
    discountPrice: {
      type: Number,
      // custom mongoose validator
      validate: {
        validator: function(val) {
          // The 'this' variable is only available to a new document
          return this.price > val;
        },
        message: "Price must be greater than discount"
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"]
    },
    slug: String,
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have an image"],
      trim: true
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [tourDateSchema],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJson
      type: {
        type: String,
        default: "Point",
        enum: ["Point"]
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      // This is how we embed a document inside another document
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"]
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        //  Child  Referencing
        type: mongoose.Schema.ObjectId,
        ref: "User"
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.virtual("durationPerWeek").get(function() {
  return this.duration / 7;
});

tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id"
});

// There are four types of middleware in mongoose
// 1) Document: only works if save(),create() methods were used
tourSchema.pre("save", function(next) {
  // The callback function have access to this keyword is pre methood
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Embeding a document into other document
// tourSchema.pre("save", async function(next) {
//   const guidesPromise = this.guides.map(async id => await User.findById(id));
//   const guides = await Promise.all(guidesPromise);
//   this.guides = guides.map(el => (el !== null ? el : "Not available"));
//   console.log(guides);

//   next();
// });

//The indexing  allows us to query a  field in the document instead of examine the whole document
// Single indexing
// Indexing improve the read performance
// tourSchema.index({ price: 1 });

// Compound indexing
tourSchema.index({ price: { ratingAverage: 4.5 } });

// GeoSpatial index
tourSchema.index({ startLocation: "2dsphere" });

tourSchema.post("save", function(doc, next) {
  next();
});

// 2) Query
// This middleware is called when query methods are called such as 'find' and more..
// We will use query middleware to with populate method to refernce the child document
tourSchema.pre(/^find/, function(next) {
  this.populate({ path: "guides", select: "-__v -_id -passwordChangedAt" });

  next();
});

tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function(doc, next) {
  console.log(`Query took ${this.start - Date.now()}`);
  next();
});
// // 3) Aggregation
// tourSchema.pre("aggregate", function(next) {
//   // we basically append another stage to the  aggregation pipeline
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

// 4) Model

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
