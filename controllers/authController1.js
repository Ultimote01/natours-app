const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Email = require("../utils/email");

const jwtToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPRIES_IN
  });
};


const sendToken = (user, statusCode, res) => {
  const token = jwtToken(user.id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPRIES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: "strict",
    secure: true
  };

  if (process.env.NODE_ENV === "prod") cookieOptions.secure = true;
  user.active = undefined;
  user.password = undefined;

  res.cookie("jwt", token, cookieOptions);
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user
    }
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    role,
    photo,
    active,
    password,
    passwordConfirm,
    passwordChangedAt
  } = req.body;

  const newUser = await User.create({
    name,
    email,
    role,
    photo,
    active,
    password,
    passwordConfirm,
    passwordChangedAt
  });
   
  await new Email(newUser, url).sendWelcome("welcome");

  sendToken(newUser, 201, res);
}); 

exports.signIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) if email or password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and passsord", 401));
  }

  // 2) Check if  email is correct &  check if password is correct
  const userData = await User.findOne({ email }).select("+password");

  //Generate a json web token & send as response to the client
  if (
    !userData ||
    !(await userData.confirmPassword(userData.password, String(password)))
  ) {
    return next(new AppError("Incorrect email or password", 404));
  }

  sendToken(userData, 200, res);
});

exports.logout = catchAsync(async (req, res) => {
  res.cookie("jwt", "loggedOut", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ status: "success" });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Check if authentication is included  in the req object
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token || token === "null" || token === "undefined") {
    return next(
      new AppError("You are not logged in! Please log in to gain access", 401)
    );
  }
  // 2)  Verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if the user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token doesn't exist", 401)
    );
  }

  // 4) Check if user changed password after the token was issued
  const userChangedPassword = currentUser.passwordChanged(decoded.iat);
  if (userChangedPassword) {
    return next(
      new AppError("User recently changed password! Please log in again", 401)
    );
  }
  // 5) Grant access to route
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

// This is only for rendered template, no error
exports.isLoggedIn = async (req, res, next) => {
  try {
    // Check if the users are authenticated
    if (req.cookies.jwt) {

      // 2)  Verify the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 3) Check if the user still exist
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 4) Check if user changed password after the token was issued
      const userChangedPassword = currentUser.passwordChanged(decoded.iat);
      if (userChangedPassword) {
        return next();
      }
      // 5) Grant access to route
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    console.log(err);
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // example [lead-guide, admin] default role is  user
    if (!roles.includes(req.user.role)) {
      next(new AppError("You are not authorized to perform this action.", 403));
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1) Check if email exist
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError("There is no user with the email address provided", 404)
    );
  }

  // 2) Generate reset Token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/user/${resetToken}`;

  // 3) Send password reset link to user email
  try {
   
    await new Email(user,resetUrl).sendPasswordReset("passwordReset");

    res.status(200).json({
      status: "success",
      message: "Token sent to email"
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResstExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending email. Try again later", 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user base on the token
  const hashedToken = crypto
    .createHash("sha-256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) Chcek if token has  expired
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }


  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) update passwordChangedAt property
  // we will implement the third step in the User model

  // 4) log the user in by sending new token
  sendToken(user, 200, res);
  // we might need to check if user already used that password
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get the user from collection
  const user = await User.findById(req.user._id).select("+password");

  // 2) Check if posted password is correct
  const passwordConfirmed = await user.confirmPassword(
    user.password,
    req.body.oldPassword
  );
  if (!passwordConfirmed) {
    console.log(user.password, req.body.oldPassword, passwordConfirmed);
    return next(
      new AppError("Password is incorrect! Please enter a valid password", 400)
    );
  }

  // Update user password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  sendToken(user, 200, res);
});
