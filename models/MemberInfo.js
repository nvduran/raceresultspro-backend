const mongoose = require("mongoose");

const MemberInfoSchema = mongoose.Schema({
  cust_id: Number,
  member: [
    {
      cust_id: Number,
      display_name: String,
      last_login: String,
      member_since: String,
      club_id: Number,
      club_name: String,
      ai: Boolean,
    },
  ],
  iRating_data: [
    {
      when: String,
      value: Number,
    },
  ],
  iRating_data_oval: [
    {
      when: String,
      value: Number,
    },
  ],
  iRating_data_dirt: [
    {
      when: String,
      value: Number,
    },
  ],
  iRating_data_dirt_oval: [
    {
      when: String,
      value: Number,
    },
  ],
  last_updated: String,
});

module.exports = mongoose.model("Member Info", MemberInfoSchema);
