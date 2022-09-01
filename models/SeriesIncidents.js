const mongoose = require("mongoose");

const SeriesIncidentsSchema = mongoose.Schema({
  series: String,
  subsession_id: Number,
  laps_complete: Number,
  start_time: String,
  license_category: String,
  event_strength_of_field: Number,
  event_laps_complete: Number,
  special_event_type: Number,
  allowed_licenses: String,
  corners_per_lap: Number,
  incidents: [],
});

module.exports = mongoose.model("Series Incidents", SeriesIncidentsSchema);
