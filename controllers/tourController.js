const multer = require("multer");
const sharp = require("sharp");

const Tour = require("../models/tourModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll
} = require("./handleFactory");
// const AppError = require("../utils/appError");

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    return cb(null, true);
  }

  cb(new AppError("Not an image. please upload only image", 404), false);
};

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, fileFilter: multerFilter });
exports.uploadUserPhoto = upload.fields([
  {name: "imageCover", maxCount: 1},
  {name: "images", maxCount: 3}
])
// exports.uploadUserPhoto = upload.single("imageCover");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {

  if (!req.files.imageCover || !req.files.images) return next();

  //(1) process the imageCover
  const filename = `tour-cover-${req.params.id}-${Date.now()}.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize({
      width: 2000,
      height: 1333
    })
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${filename}`);
  req.body.imageCover = filename;

  //(2) Process the images
  req.body.images = []
  await Promise.all(req.files.images.map( async (file,index) =>  {
    const filename = `tour-${req.params.id}-${Date.now()}-${index+1}.jpeg`;
    await sharp(file.buffer)
    .resize({
      width: 2000,
      height: 1333
    })
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${filename}`);
     req.body.images.push(filename)
  })).catch(() =>  {
   });
  
  next();
});



exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingAverage,price";
  req.query.fields = "name, price, ratingAverage, summary, difficulty";

  next();
};

exports.getAllTours = getAll(Tour);
exports.getTour = getOne(Tour, { path: "reviews" });
exports.createTour = createOne(Tour);
exports.updateTour = updateOne(Tour);
exports.deleteTour = deleteOne(Tour);

// mongodb aggregation  pipeline stages
// we define our match
// we can group by fields
// we can also  add more stages
exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingAverage: { $gt: 2.5 } }
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        numTours: { $sum: 1 },
        numRatings: { $avg: "$ratingQuantity" },
        avgRatings: { $avg: "$ratingAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" }
      }
    },
    { $sort: { avgPrice: 1 } }
    // {
    //   $match: { _id: { $ne: "EASY" } }
    // }
  ]);
  res.status(200).json({
    status: "success",
    stats
  });
});

// mongodb aggregation pipeline stages
// unwinding
exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.id * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates"
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" }
      }
    },
    {
      $addFields: { month: "$_id" }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: "success",
    plan
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  // We will get the params in order to perform GeoSpatial query
  // for more information : reference /doc / mongodb.com
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(
      new AppError(
        "Please provide latitude and longtitude in this format: lat,lng",
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    staus: "success",
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(
      new AppError(
        "Please provide latitude and longtitude in this format: lat,lng",
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: "distance",
        //Result is measure in metre, so we can use multiplier to get result in miles or kilometre
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: "success",
    data: {
      distances
    }
  });
});
