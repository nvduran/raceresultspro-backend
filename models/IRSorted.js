const mongoose = require("mongoose");

const IRSortedSchema = mongoose.Schema({
  Arr: [],
  OvalArr: [],
  DirtArr: [],
  DirtOvalArr: [],
});

module.exports = mongoose.model("IR Sorted", IRSortedSchema);
