const validator = require("validator");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFEATURES = require("../utils/apiFeatures");


exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const doc = await Model.findByIdAndDelete(id);

    if (!doc) {
      return next(
        new AppError(`Could not find a document for the id: ${id}`, 404)
      );
    }

    res.status(204).json({
      status: "success"
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    if (req.file?.filename) {
      req.body.photo = req.file.filename;
    }
    let { id } = req.params;
  
    // checks if route is for user
    if (req.originalUrl.includes("user")){
    id = req.user ? req.user._id : id;
    };

    const doc = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
      revalidator: true
    });

    if (!doc) {
      return next(
        new AppError(`Could not find a document for the id: ${id}`, 404)
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res) => {
    let query = req.body;
    if (req.params.tourId) {
      const tour = req.params.tourId;
      query = { ...query, tour };
    }

    const doc = await Model.create(query);

    //Overwrite the user and tour property if they exist
    doc.user = undefined;
    doc.tour = undefined;

    // This block update Tour fields if booking was successfull 
    if (req.tourDateInstance) {
      // Increment the participants
      req.tourDateInstance.dateInstance.participants+=1;

    // 5. Mark soldOut if full
    if (req.tourDateInstance.dateInstance.participants >= req.tourDateInstance.tour.maxGroupSize) {
      req.tourDateInstance.dateInstance.soldOut = true;
    }

       // 6. Save updates 
      await req.tourDateInstance.tour.save();
    }


    res.status(201).json({
      status: "success",
      createdAt: Date.now(),
      data: { 
        data: doc
      }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // get document by name or ID
    const { id } = req.params;
    const isString = validator.isAlpha(id.replace(/\s+/g, "").toLowerCase());
    const queryString = isString ? { name: id } : { _id: id };
    let query = Model.find(queryString);
    if (popOptions) query = Model.find(queryString).populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(
        new AppError(`Could not find a document for the id: ${id}`, 404)
      );
    }

    res.status(200).json({
      status: "success",
      doc
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res) => {
    // let filter = {};
    // if (req.params.tourId) filter = { tour: req.params.tourId };
    let paramArg;
    if (req.params.tourId) paramArg = {tour : {$eq : req.params.tourId}};
    const features = new APIFEATURES(Model, req.query, paramArg)
      .filter()
      .sort()
      .fields()
      .limit();

    // Execute query;
    const doc = await features.query;

    //Send resonse
    res.status(200).json({
      status: "success",
      length: doc.length,
      data: {
        data: {
          doc
        }
      }
    });
  });
