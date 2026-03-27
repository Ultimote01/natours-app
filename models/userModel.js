const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

//name,email,photo,password,passconfirmed
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    max: [10, "Must not be more than ten characters"]
  },
  email: {
    type: String,
    required: [true, "Please provide an emaail"],
    lowercase: true,
    unique: true,
    validate: [validator.isEmail, "Please enter a valid email address"]
  },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user"
  },
  photo: {
    type: String,
    default: "default.jpg"
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minLength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please provide a password"],
    //This only works on create or save
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: "Password does not match"
    }
  },
  active: {
    type: Boolean,
    select: false,
    default: true
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
});

userSchema.pre("save", async function(next) {
  // only runs if password is modified
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function(next) {
  if (!this.isModified("password") || this.isNew) {
    return next();
  }

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre("save", async function(next) {
  if (this.isNew){
    this.role = "user";
    this.active = "true";
    this.photo = "default.jpg";
  }
  next();
})

userSchema.pre(/^find/, function(next) {
  // This point to the current query
  this.find({ active: { $ne: false } });
  next();
});

// we will create a custom method for the schema object
userSchema.methods.confirmPassword = async function(
  hashedPassword,
  plainPassword
) {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

userSchema.methods.passwordChanged = function(jwtTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return jwtTimeStamp < changedTimeStamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
