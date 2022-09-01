const mongoose = require("mongoose");

const IncidentsSortedSchema = mongoose.Schema({
  sorted_avgs: [
    {
      series: String,
      average_incidents: Number,
      license_category: String,
      event_strength_of_field: Number,
      event_laps_complete: Number,
      special_event_type: Number,
      allowed_licenses: String,
      corners_per_lap: Number,
    },
  ],
});

module.exports = mongoose.model("Incidents Sorted", IncidentsSortedSchema);
