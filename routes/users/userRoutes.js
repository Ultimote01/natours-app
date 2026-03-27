const express = require("express");
const {
  getAllUsers,
  getActiveUser,
  getUser,
  updateMe,
  deleteMe,
  filterUpdateMe,
  createUser,
  deleteUser,
  upDateUser,
  uploadUserPhoto,
  resizeUserPhoto
} = require("../../controllers/userController");
const {
  signUp,
  signIn,
  protect,
  restrictTo,
  resetPassword,
  forgetPassword,
  updatePassword,
  logout
} = require("../../controllers/authController");

const router = express.Router();

router.route("/signup").post(uploadUserPhoto, signUp);
router.route("/login").post(signIn);
router.route("/logout").get(logout);

router.route("/forgetPassword").post(forgetPassword);
router.route("/resetPassword/:token").patch(resetPassword);

// This middleware protect all routes
router.use(protect);

router.route("/updateMyPassword").patch(updatePassword);
router
  .route("/updateMe")
  .patch(uploadUserPhoto, resizeUserPhoto, filterUpdateMe, updateMe);
router.route("/me").get(getActiveUser);
router.route("/deleteMe").delete(deleteMe);

// This middleware grant access to this routes if its administrator
router.use(restrictTo("admin", "lead-guide"));
router
  .route("/")
  .get(getAllUsers)
  .post(createUser);

// eslint-disable-next-line prettier/prettier
router.route("/:id").get(getUser).patch(upDateUser);
router.route("/:id").delete(deleteUser);

module.exports = router;
