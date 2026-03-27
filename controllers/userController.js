const bcrypt = require("bcryptjs");
const multer = require("multer");
const sharp = require("sharp");

const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { updateOne, getAll, createOne, deleteOne } = require("./handleFactory");

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    return cb(null, true);
  }

  cb(new AppError("Not an image. please upload only image", 404), false);
};

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, fileFilter: multerFilter });
exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
   

  const filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  sharp(req.file.buffer)
    .resize({
      width: 500,
      height: 500
    })
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${filename}`);
  req.file.filename = filename;
  next();
});

function filterObj(obj, ...allowedFields) {
  const newObj = {};

  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
}

exports.getActiveUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    status: "sucess",
    data: {
      user
    }
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  res.status(200).json({
    status: "sucess",
    data: {
      user
    }
  });
});

// This middleware works with updateMe
exports.filterUpdateMe = (req, res, next) => {
  // 1) Check if password or confirmPassword is in field
  console.log("Getting request body", req.body);
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for  password update. Please use updateMyPassword route",
        400
      )
    );
  }
  // 2) Filter posted data for required fields
  const filteredObj = filterObj(req.body, "name", "email");
  req.body = filteredObj;
  next();
};

exports.getAllUsers = getAll(User);
exports.createUser = createOne(User);
exports.deleteUser = deleteOne(User);
// Do not update password with this function
exports.updateMe = updateOne(User);

exports.deleteMe = catchAsync(async (req, res, next) => {
  // 1) Get user by id
  await User.findByIdAndUpdate(
    req.user._id,
    { active: false },
    { runValidators: true }
  );
  res.status(204).json();
});

exports.upDateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (req.body.password && !req.body.passwordConfirm) {
    next(new AppError("Please confirm new password", 403));
  }
  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 12);
    delete req.body.passwordConfirm;
  }
  const user = await User.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    next(AppError("User not found. Please provide valid user id."));
  }

  res.status(200).json({
    status: "sucess",
    data: {
      data: user
    }
  });
});
