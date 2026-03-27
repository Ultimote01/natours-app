const express = require("express");
const bodyParser = require("body-parser");
const {
  getOverview,
  getTour,
  loginPage,
  getAccount,
  submitUserData
  ,modifyHeader,
  getMyTours,
  signupPage
} = require("../../controllers/viewConntroller");
const { isLoggedIn, protect } = require("../../controllers/authController");
const {
  uploadUserPhoto,
  resizeUserPhoto
} = require("../../controllers/userController");
const {webhookCheckout} = require("../../controllers/bookingController")
const router = express.Router();

// We can pass a local variable as an object
router.use( modifyHeader);
router.post("/webhook", bodyParser.raw({type: "application/json"}),webhookCheckout);
router.get("/", isLoggedIn, getOverview);
router.get("/tour/:slug", isLoggedIn, getTour);
router.get("/signup", isLoggedIn, signupPage);
router.get("/loggin", isLoggedIn, loginPage);
router.get("/me", protect, getAccount);
router.get('/my-tours', protect, getMyTours);

router.patch(
  "/submit-user-data",
  protect,
  uploadUserPhoto,
  resizeUserPhoto,
  submitUserData
);

module.exports = router;
