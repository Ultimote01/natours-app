const Tour = require("../models/tourModel");
const AppError = require("../utils/appError");
const User = require("../models/userModel");
const Booking = require("../models/bookingModel")
const catchAsync = require("../utils/catchAsync");
const { contentSecurityPolicy } = require("helmet");

exports.modifyHeader = (req, res,next)=> {

  const stripeLinks =  "'self' https://js.stripe.com; connect-src 'self' https://api.stripe.com https://js.stripe.com;"
  const cotentSecurityPolicy = res.getHeaders()["content-security-policy"];
  const modifiedContentSecurityPolicy = cotentSecurityPolicy.split(";").map((el)=>{
    if (el === "script-src 'self'") return "script-src " + stripeLinks;
    // else if (el === "")
    return el+";";
  }).toString().replaceAll(',',"");
  
  res.setHeader("Content-Security-Policy", modifiedContentSecurityPolicy);
  next();
}


exports.getOverview = catchAsync(async (req, res) => {
  //Get  the tour data
  const tours = await Tour.find();
  //build the template

  // res.setHeader("Content-Security-Policy",
  //   "script-src 'self' https://js.stripe.com; connect-src 'self' https://api.stripe.com https://js.stripe.com;");
  res.status(200).render("overview", {
    title: "Exciting tours for adventurous people",
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  const userActive = res.locals?.user?.role === "user"? false : true;
  const tour = await Tour.findOne({ slug }).populate({
    path: "reviews",
    field: ["rating, review", "user"]
  });

  if (!tour) return next(new AppError("There is no tour with that name", 404));

  res.status(200).render("tour", {
    title: `${tour.name} Tour`,
    tour: tour,
    userActive
  });
});

exports.loginPage = async (req, res, next) => {
  res.header(
    "Content-Security-Policy",
    "script-src 'self' https://cdnjs.cloudflare.com"
  );
  res.status(200).render("loginpage", {
    title: "Login"
  });
};

exports.signupPage = async (req, res, next) => {
  res.header(
    "Content-Security-Policy",
    "script-src 'self' https://cdnjs.cloudflare.com"
  );
  res.status(200).render("signupPage", {
    title: "Login"
  });
};


exports.getAccount = async (req, res) => {
 
  res.status(200).render(req.user? "account" : "loginpage", {
    title: "Your Account"
  });
};

exports.submitUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
      photo: req.file.filename
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).render("account", {
    title: "Your Account",
    user: updatedUser
  });
});

async function findAllBookings (){
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  return tours;
} 


exports.getMyTours = catchAsync(async (req, res, next) => {
  
  const tours = await findAllBookings();

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});

 