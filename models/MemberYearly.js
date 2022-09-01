const mongoose = require("mongoose");

const MemberYearlySchema = mongoose.Schema({
  stats: [
    {
      category_id: Number,
      category: String,
      starts: Number,
      wins: Number,
      top5: Number,
      poles: Number,
      avg_start_position: Number,
      avg_finish_position: Number,
      laps: Number,
      laps_led: Number,
      avg_incidents: Number,
      avg_points: Number,
      win_percentage: Number,
      top5_percentage: Number,
      laps_led_percentage: Number,
      total_club_points: Number,
    },
    {
      category_id: Number,
      category: String,
      starts: Number,
      wins: Number,
      top5: Number,
      poles: Number,
      avg_start_position: Number,
      avg_finish_position: Number,
      laps: Number,
      laps_led: Number,
      avg_incidents: Number,
      avg_points: Number,
      win_percentage: Number,
      top5_percentage: Number,
      laps_led_percentage: Number,
      total_club_points: Number,
    },
    {
      category_id: Number,
      category: String,
      starts: Number,
      wins: Number,
      top5: Number,
      poles: Number,
      avg_start_position: Number,
      avg_finish_position: Number,
      laps: Number,
      laps_led: Number,
      avg_incidents: Number,
      avg_points: Number,
      win_percentage: Number,
      top5_percentage: Number,
      laps_led_percentage: Number,
      total_club_points: Number,
    },
    {
      category_id: Number,
      category: String,
      starts: Number,
      wins: Number,
      top5: Number,
      poles: Number,
      avg_start_position: Number,
      avg_finish_position: Number,
      laps: Number,
      laps_led: Number,
      avg_incidents: Number,
      avg_points: Number,
      win_percentage: Number,
      top5_percentage: Number,
      laps_led_percentage: Number,
      total_club_points: Number,
    },
  ],
  cust_id: Number,
});

module.exports = mongoose.model("Member Yearly", MemberYearlySchema);