const AppError = require("../utils/appError");

const handleCastErrorDb = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = err => {
  const value = err.keyValue.name;
  const message = `Duplacte field value "${value}". plase use a different value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = errors.join(". ");
  // return err;
  return new AppError(message, 400);
};

const handleJWTInvalidError = () => {
  return new AppError("Invalid token! Please log in  ", 401);
};

const handleJWTExpiredError = () => {
  return new AppError("Token expired! Please  log in", 401);
};

const sendErrorDev = (res, req, err) => {
  // A) Chceck  if  url  is api route
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errStack: err.stack
    });
  }
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong ",
    msg: err.message
  });
};

const sendErrorProd = (res, req, err) => {
  // B) Chceck  if  url  is api route
  if (req.originalUrl.startsWith("/api")) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // If not operational
    return res.status(500).json({
      status: "error",
      message: "Something went wrong"
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong ",
      msg: err.message
    });
  }
  // If not operational
  return res.status(500).render("error", {
    title: "Something went wrong ",
    msg: "Something went wrong, try agin later"
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  console.log(err);

  if (process.env.NODE_ENV === "dev") {
    sendErrorDev(res, req, err);

    
  } else if (process.env.NODE_ENV === "prod") {
    let error = { ...err };
    error.message = err.message;
    console.log(error.message, error.isOperational);
    if (err.name === "CastError") error = handleCastErrorDb(err);
    if (err.code === 11000) error = handleDuplicateFieldDB(error);
    if (err.name === "ValidationError") error = handleValidationErrorDB(error);
    if (err.name === "JsonWebTokenError") error = handleJWTInvalidError();
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();
    sendErrorProd(res, req, error);
  }
};
