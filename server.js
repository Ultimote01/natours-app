const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: `${__dirname}/config.env` });
const app = require("./app");

const db = process.env.DATABASE.replace(
  "<db_password>",
  process.env.DB_PASSWORD
);
mongoose
  .connect(db, {
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: true,
    // useUnifiedTopology: true
  })
  .then(() => "connection successful");

const port = process.env.PORT;

const server = app.listen(port, "127.0.0.1", () => {
  console.log("Connection running on port 8000");
});

process.on("unhandledRejection", err => {
  console.log(err.name, err.message);
  console.log(`Uncaught Rejection. Shutting down...`);
  // process.exit(1);
  server.close(); 
});

// This would catch unhandled synchronous error
process.on("uncaughtException", err => {
  console.log(err.name, err.message);
  console.log("Unhandled Exception. Shutting Down..");
  server.close();
});
