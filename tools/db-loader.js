const fetch = require("node-fetch"); //this may be outdated with the newest node.js, but plenty of docs exist for including other files
const express = require("express");
const mongoose = require("mongoose");
const MemberInfo = require("../models/memberInfo");
const IRSorted = require("../models/IRSorted");
const SeriesIncidents = require("../models/SeriesIncidents");
const IncidentsSorted = require("../models/IncidentsSorted");
const app = express();
var cors = require("cors");
const bodyParser = require("body-parser");
var loginCookies = "";
const MemberYearly = require("../models/memberYearly");
// const memberStatsRoute = require("../routes/memberStats");
// const MemberYearly = require("../models/MemberYearly");
const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });
var CryptoJS = require("crypto-js");
var AES = require("crypto-js/aes");
var SHA256 = require("crypto-js/sha256");
var Base64 = require("crypto-js/enc-base64");
let recentlyDeleted;
let waitTime = 1000;
// 070822 739
let latestSubsession1 = 47241623;

// CONNECT TO MONGODB
mongoose.connect(process.env.DB_CONNECTION, () => {
  console.log("Connected to DB!");
  // get auth'd
  getAuth();
});

async function getAuth() {
  console.log("AUTH db");
  var hash = CryptoJS.SHA256(
    process.env.IR_PASSWORD + process.env.IR_USERNAME.toLowerCase()
  );
  // The values in parenthesis evaluate to ("MyPassWord"+"clunky@iracing.com")
  // Notice the password value maintains its case, while the lowercase username is used here

  //Then we need to enc the hash in Base64
  var hashInBase64 = CryptoJS.enc.Base64.stringify(hash);

  const accessReply = await fetch("https://members-ng.iracing.com/auth", {
    method: "POST",
    body: JSON.stringify({
      email: "nvduran@gmail.com",
      password: hashInBase64,
    }),
    credentials: "include",
    headers: { Accept: "*/*", "Content-type": "application/json" },
  });
  const replyBody = await accessReply.json();
  var statusCode = await accessReply.status;
  console.log("Auth status code: " + statusCode);
  if (statusCode == 200) {
    // delay = originalDelay;
    setTimeout(async () => await startHere(), 3000);
  }
  if (statusCode == 503) {
    // delay = maintenceDelay;
  }
  if (statusCode == 401) {
    getAuth();
  }
  loginCookies = parseCookies(accessReply);
  return statusCode;
}

async function renewAuth() {
  console.log("AUTH db");
  var hash = CryptoJS.SHA256(
    process.env.IR_PASSWORD + process.env.IR_USERNAME.toLowerCase()
  );
  var hashInBase64 = CryptoJS.enc.Base64.stringify(hash);

  const accessReply = await fetch("https://members-ng.iracing.com/auth", {
    method: "POST",
    body: JSON.stringify({
      email: "nvduran@gmail.com",
      password: hashInBase64,
    }),
    credentials: "include",
    headers: { Accept: "*/*", "Content-type": "application/json" },
  });
  const replyBody = await accessReply.json();
  var statusCode = await accessReply.status;
  console.log("Auth status code: " + statusCode);
}

function parseCookies(response) {
  const raw = response.headers.raw()["set-cookie"];
  return raw
    .map((entry) => {
      const parts = entry.split(";");
      const cookiePart = parts[0];

      return cookiePart;
    })
    .join(";");
}

// ***********************STARTER FUNCTION *********************************
function startHere() {
  console.log("STARTING");
  // updateAlliRatings();
  // addLastUpdatedtoAll();
  // removeDupCusts();
  // massMemberAdd();
  // getiRatingLinkData(393396);
  // pushIRSorted();
  // pullSessionResults(21975504);
  // massSessionIncidents();
  // getSeasonResults(2021);
  // addManySessionIncidents();
  pushIncidentsSorted();
}
// **************************************************************************

async function getiRatingLinkData(cust_id) {
  // let url =
  //   "https://members-ng.iracing.com/data/member/chart_data?cust_id=" +
  //   cust_id +
  //   "&category_id=2" +
  //   "&chart_type=1";
  let url =
    "https://members-ng.iracing.com/data/member/get?cust_ids=393396" + cust_id;

  let accessReply = await fetch(url, {
    method: "get",
    headers: { Accept: "application/json", cookie: loginCookies },
    cache: "no-store",
  });

  var replyBody = await accessReply;
  var statusCode = await accessReply.status;

  console.log("Status code: " + statusCode);
  console.log("replyBody: " + replyBody);
}

// update db user WITHOUT deleting old data
async function updateIratingData(custID) {
  try {
    let ir_array = await getiRatingLinkData(custID);
    let ir_array_oval = await getiRatingLinkDataOval(custID);
    let ir_array_dirt = await getiRatingLinkDataDirt(custID);
    let ir_array_dirt_oval = await getiRatingLinkDataDirtOval(custID);
    const query = { cust_id: custID }; //your query here
    const update = {
      iRating_data: ir_array,
      iRating_data_oval: ir_array_oval,
      iRating_data_dirt: ir_array_dirt,
      iRating_data_dirt_oval: ir_array_dirt_oval,
    }; //your update in json here
    const option = { new: true }; //will return updated document
    await MemberInfo.findOneAndUpdate(query, update);
  } catch (error) {
    console.log(error);
  }
}

async function updateAlliRatings() {
  try {
    await MemberInfo.find().then((results) => {
      console.log(results);
      results.forEach((user) => {
        updateIratingData(user.cust_id);
      });
    });
  } catch (error) {
    console.log(error);
  }
}

async function updateManyiRatings() {
  for (let i = 400000; i < 100; i++) {
    updateIratingData(i);
  }
}

async function updateLastUpdated(custID) {
  try {
    let today = new Date().toISOString().slice(0, 10);

    const query = { cust_id: custID }; //your query here
    const update = { last_updated: today }; //your update in json here
    const option = { new: true }; //will return updated document
    await MemberInfo.findOneAndUpdate(query, update, option);
  } catch (error) {
    console.log(error);
  }
}

async function addLastUpdatedtoAll() {
  try {
    await MemberInfo.find().then((results) => {
      console.log(results);
      results.forEach((user) => {
        updateLastUpdated(user.cust_id);
      });
    });
  } catch (error) {
    console.log(error);
  }
}

async function removeDupCusts() {
  try {
    let idArray = [];
    await MemberInfo.find().then((results) => {
      results.forEach((member) => {
        console.log(member.cust_id);

        if (idArray.includes(member.cust_id)) {
          MemberInfo.findOneAndDelete(
            { cust_id: member.cust_id },
            (err, Customer) => {
              if (!err) {
                recentlyDeleted = member.cust_id;
                console.log("deleted " + Customer + recentlyDeleted);
              } else {
                console.log("Error removing :" + err);
              }
            }
          );
        } else {
          idArray.push(member.cust_id);
        }
      });
    });
  } catch (error) {
    console.log(error);
  }
}

async function massMemberAdd() {
  // rate limit test
  setInterval(async () => {
    getiRatingLinkData(393396);
  }, 10000);
  // end rate limit test

  // Returns a Promise that resolves after "ms" Milliseconds
  const timer = (ms) => new Promise((res) => setTimeout(res, ms));

  for (let i = 423400; i < 430000; i++) {
    memberInfoLookup(i);
    await timer(waitTime);
    console.log("Saved " + i);
  }
}

async function addManySessionIncidents() {
  const timer = (ms) => new Promise((res) => setTimeout(res, ms));
  for (let i = 3604; i < 3850; i++) {
    console.log("$$$$$$$$$$$$$$$$$ " + i + " $$$$$$$$$$$$$$$$$$");
    // if (i % 50 == 0) {
    //   renewAuth();
    // }
    massSessionIncidents(i);
    await timer(8000);
  }
}

async function massSessionIncidents(seasonID) {
  let ansArr = [];
  // Returns a Promise that resolves after "ms" Milliseconds
  const timer = (ms) => new Promise((res) => setTimeout(res, ms));

  const racesObj = getSeasonResults(seasonID);
  racesObj.then((results) => {
    try {
      results.results_list.forEach((item) => {
        ansArr.push(item.subsession_id);
      });
    } catch (error) {
      console.log(error);
    }
    //sort ansArr from highest to lowest
    ansArr.sort((a, b) => b - a);
    // shorten ansArr to only the top 20
    ansArr = ansArr.slice(0, 20);

    console.log(ansArr);

    const foo = async (arr1) => {
      for (let i = 0; i < arr1.length; i++) {
        pullSessionResults(arr1[i]);
        await timer(waitTime);
        console.log("Saved " + i);
      }
    };
    foo(ansArr);
  });
}

// look up member info and send to pushMemberInfo
async function memberInfoLookup(cust_id) {
  let url =
    "https://members-ng.iracing.com/data/member/get?cust_ids=" + cust_id;

  try {
    let accessReply = await fetch(url, {
      method: "get",
      headers: { Accept: "application/json", cookie: loginCookies },
      cache: "no-store",
    });

    var replyBody = await accessReply.json();
    var statusCode = await accessReply.status;
    const timer = (ms) => new Promise((res) => setTimeout(res, ms));

    if (accessReply.headers.get("x-ratelimit-remaining") < 200) {
      waitTime = 1500;
    } else if (accessReply.headers.get("x-ratelimit-remaining") < 100) {
      waitTime = 30000;
    } else {
      waitTime = 500;
    }

    if (replyBody.link != null) {
      var resultLink = replyBody.link;

      const amazonReply = await fetch(resultLink, {
        method: "get",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      var resultsBody = await amazonReply.json();
      var amazonStatus = await amazonReply.status;

      if (resultsBody.members[0].cust_id) {
        pushMemberInfo(resultsBody);
      }
    }
    return "Member not found?";
  } catch (error) {
    console.error(error.message);
    console.error(error.stack);
    return "Lookup Error";
  }
}

// push member info to DB
async function pushMemberInfo(member) {
  // assign model and values to result object
  var resultsObj = new MemberInfo({
    cust_id: member.cust_ids[0],
    member: [
      {
        cust_id: member.members[0].cust_id,
        display_name: member.members[0].display_name,
        last_login: member.members[0].last_login,
        member_since: member.members[0].member_since,
        club_id: member.members[0].club_id,
        club_name: member.members[0].club_name,
        ai: member.members[0].ai,
      },
    ],
  });

  let dupTest = await MemberInfo.findOne({ cust_id: member.cust_ids[0] });
  if (dupTest) {
    console.log("Member info already exists");
  } else {
    // save result to db
    resultsObj.save((err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log(member.cust_ids[0] + " info saved to DB");
        updateLastUpdated(member.cust_ids[0]);
        updateIratingData(member.cust_ids[0]);
      }
    });
  }
}

async function updateLastUpdated(custID) {
  try {
    let today = new Date().toISOString().slice(0, 10);

    const query = { cust_id: custID }; //your query here
    const update = { last_updated: today }; //your update in json here
    const option = { new: true }; //will return updated document
    await MemberInfo.findOneAndUpdate(query, update);
  } catch (error) {
    console.log(error);
  }
}

async function updateMemberInfo(custID) {
  MemberInfo.findOneAndRemove({ cust_id: custID }).then((user) => {
    if (!user) {
      console.log("User not found");
    } else {
      console.log("Deleted " + user.cust_id);
      memberInfoLookup(user.cust_id);
    }
  });
}

// return array of oval irating data
async function getiRatingLinkDataOval(cust_id) {
  let Ovalurl =
    "https://members-ng.iracing.com/data/member/chart_data?cust_id=" +
    cust_id +
    "&category_id=1" +
    "&chart_type=1";

  try {
    let accessReply = await fetch(Ovalurl, {
      method: "get",
      headers: { Accept: "application/json", cookie: loginCookies },
      cache: "no-store",
    });

    var replyBody = await accessReply.json();
    var statusCode = await accessReply.status;

    if (replyBody.link != null) {
      var resultLink = replyBody.link;

      const amazonReply = await fetch(resultLink, {
        method: "get",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      var resultsBody = await amazonReply.json();
      var amazonStatus = await amazonReply.status;

      return resultsBody.data;
    }
    return "Member not found?";
  } catch (error) {
    console.error(error.message);
    console.error(error.stack);
    return "Lookup Error";
  }
}

// update db user WITHOUT deleting old data
async function updateIratingDataOval(custID) {
  try {
    let ir_array = await getiRatingLinkDataOval(custID);
    const query = { cust_id: custID }; //your query here
    const update = { iRating_data_oval: ir_array }; //your update in json here
    const option = { new: true }; //will return updated document
    await MemberInfo.findOneAndUpdate(query, update);
  } catch (error) {
    console.log(error);
  }
}
// return array of dirt road irating data
async function getiRatingLinkDataDirt(cust_id) {
  let Dirturl =
    "https://members-ng.iracing.com/data/member/chart_data?cust_id=" +
    cust_id +
    "&category_id=4" +
    "&chart_type=1";

  try {
    let accessReply = await fetch(Dirturl, {
      method: "get",
      headers: { Accept: "application/json", cookie: loginCookies },
      cache: "no-store",
    });

    var replyBody = await accessReply.json();
    var statusCode = await accessReply.status;

    if (replyBody.link != null) {
      var resultLink = replyBody.link;

      const amazonReply = await fetch(resultLink, {
        method: "get",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      var resultsBody = await amazonReply.json();
      var amazonStatus = await amazonReply.status;

      return resultsBody.data;
    }
    return "Member not found?";
  } catch (error) {
    console.error(error.message);
    console.error(error.stack);
    return "Lookup Error";
  }
}

// return array of dirt oval irating data
async function getiRatingLinkDataDirtOval(cust_id) {
  let DirtOvalurl =
    "https://members-ng.iracing.com/data/member/chart_data?cust_id=" +
    cust_id +
    "&category_id=3" +
    "&chart_type=1";

  try {
    let accessReply = await fetch(DirtOvalurl, {
      method: "get",
      headers: { Accept: "application/json", cookie: loginCookies },
      cache: "no-store",
    });

    var replyBody = await accessReply.json();
    var statusCode = await accessReply.status;

    if (replyBody.link != null) {
      var resultLink = replyBody.link;

      const amazonReply = await fetch(resultLink, {
        method: "get",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      var resultsBody = await amazonReply.json();
      var amazonStatus = await amazonReply.status;

      return resultsBody.data;
    }
    return "Member not found?";
  } catch (error) {
    console.error(error.message);
    console.error(error.stack);
    return "Lookup Error";
  }
}

// push sorted array to db *DANGER ZONE BE CAREFUL*
async function pushIRSorted() {
  try {
    let allYearliesArray = [];
    let iRatingArray = [];
    let iRatingArrayOval = [];
    let iRatingArrayDirt = [];
    let iRatingArrayDirtOval = [];
    let onlyActiveRatings = [];
    let onlyActiveRatingsOval = [];
    let onlyActiveRatingsDirt = [];
    let onlyActiveRatingsDirtOval = [];
    console.log("getting sorted irating array");
    await MemberInfo.find({})
      .then((results) => {
        console.log("now filtering active");
        allYearliesArray = results;
        allYearliesArray.forEach((element) => {
          if (element.iRating_data.length > 0) {
            iRatingArray.push(
              element.iRating_data[element.iRating_data.length - 1]
            );
          }
          if (element.iRating_data_dirt.length > 0) {
            iRatingArrayDirt.push(
              element.iRating_data_dirt[element.iRating_data_dirt.length - 1]
            );
          }
          if (element.iRating_data_oval.length > 0) {
            iRatingArrayOval.push(
              element.iRating_data_oval[element.iRating_data_oval.length - 1]
            );
          }
          if (element.iRating_data_dirt_oval.length > 0) {
            iRatingArrayDirtOval.push(
              element.iRating_data_dirt_oval[
                element.iRating_data_dirt_oval.length - 1
              ]
            );
          }
        });
      })
      .catch((err) => {
        console.log(err);
      });
    iRatingArray.forEach((element) => {
      if (element.when.charAt(2) === "2") {
        onlyActiveRatings.push(element.value);
      }
    });
    iRatingArrayDirt.forEach((element) => {
      if (element.when.charAt(2) === "2") {
        onlyActiveRatingsDirt.push(element.value);
      }
    });
    iRatingArrayOval.forEach((element) => {
      if (element.when.charAt(2) === "2") {
        onlyActiveRatingsOval.push(element.value);
      }
    });
    iRatingArrayDirtOval.forEach((element) => {
      if (element.when.charAt(2) === "2") {
        onlyActiveRatingsDirtOval.push(element.value);
      }
    });

    onlyActiveRatings.sort((a, b) => b - a);
    onlyActiveRatingsDirt.sort((a, b) => b - a);
    onlyActiveRatingsOval.sort((a, b) => b - a);
    onlyActiveRatingsDirtOval.sort((a, b) => b - a);

    //delete previous data
    IRSorted.deleteMany({});
    console.log("deleted previous data");
    console.log(onlyActiveRatingsDirt);

    var savedArray = new IRSorted({
      Arr: onlyActiveRatings,
      DirtArr: onlyActiveRatingsDirt,
      OvalArr: onlyActiveRatingsOval,
      DirtOvalArr: onlyActiveRatingsDirtOval,
    });

    console.log(savedArray);

    // save new data
    savedArray.save((err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log("sorted irating array saved to DB");
      }
    });
  } catch (err) {
    console.log(err);
  }
}

// get and return subsession results
async function getSessionResults(subsession_id) {
  let seriesResultsUrl =
    "https://members-ng.iracing.com/data/results/get?subsession_id=" +
    subsession_id;

  try {
    let accessReply = await fetch(seriesResultsUrl, {
      method: "get",
      headers: { Accept: "application/json", cookie: loginCookies },
      cache: "no-store",
    });

    var replyBody = await accessReply.json();
    var statusCode = await accessReply.status;

    console.log(
      "********************************************************" +
        accessReply.headers.get("x-ratelimit-remaining")
    );

    if (accessReply.headers.get("x-ratelimit-remaining") < 200) {
      waitTime = 10000;
    } else if (accessReply.headers.get("x-ratelimit-remaining") < 150) {
      waitTime = 60000;
    } else {
      waitTime = 1000;
    }

    if (replyBody.link != null) {
      console.log(
        "****************************************" +
          accessReply.headers.get("x-ratelimit-remaining")
      );
      var resultLink = replyBody.link;

      const amazonReply = await fetch(resultLink, {
        method: "get",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      var resultsBody = await amazonReply.json();
      var amazonStatus = await amazonReply.status;
      return resultsBody;
    }

    return "Session not found?";
  } catch (error) {
    console.error(error.message);
    console.error(error.stack);
    return "Lookup Error";
  }
}

// pull session results from getsessionresults and save to db
async function pullSessionResults(id) {
  let incidentsArr = [];
  try {
    //async done right**********
    let subsession_obj = getSessionResults(id);
    subsession_obj.then((results) => {
      try {
        //for each session result, find simsession_name
        results.session_results.forEach((element) => {
          if (element.simsession_name === "RACE") {
            element.results.forEach((entry) => {
              incidentsArr.push(entry.incidents);
            });
            console.log(incidentsArr);
          }
        });
      } catch {}
      // DB
      console.log(results.start_time);
      let resultsObj = new SeriesIncidents({
        series: results.series_name,
        subsession_id: results.subsession_id,
        laps_complete: results.race_summary.laps_complete,
        start_time: results.start_time,
        license_category: results.license_category,
        event_strength_of_field: results.event_strength_of_field,
        event_laps_complete: results.event_laps_complete,
        special_event_type: results.race_summary.special_event_type,
        event_laps_complete: results.event_laps_complete,
        allowed_licenses: results.allowed_licenses[0].group_name,
        corners_per_lap: results.corners_per_lap,
        incidents: incidentsArr,
      });

      // save result to db
      if (!results.race_summary) {
        console.log("subsession " + results.subsession_id + " not a race");
      } else {
        resultsObj.save((err, result) => {
          if (err) {
            console.log(err);
          } else {
            console.log(
              results.subsession_id + " series incidents saved to DB"
            );
          }
        });
      }
    });
  } catch (err) {
    console.log(err);
  }
}

// get and return season results
async function getSeasonResults(season_id) {
  let seriesResultsUrl =
    "https://members-ng.iracing.com/data/results/season_results?season_id=" +
    season_id +
    "&event_type=5";

  try {
    let accessReply = await fetch(seriesResultsUrl, {
      method: "get",
      headers: { Accept: "application/json", cookie: loginCookies },
      cache: "no-store",
    });

    var replyBody = await accessReply.json();
    var statusCode = await accessReply.status;

    console.log(accessReply.headers.get("x-ratelimit-remaining"));

    if (replyBody.link != null) {
      console.log(accessReply.headers.get("x-ratelimit-remaining"));
      var resultLink = replyBody.link;

      const amazonReply = await fetch(resultLink, {
        method: "get",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      var resultsBody = await amazonReply.json();
      var amazonStatus = await amazonReply.status;
      return resultsBody;
    }

    return "Session not found?";
  } catch (error) {
    console.error(error.message);
    console.error(error.stack);
    return "Lookup Error";
  }
}

// push IncidentsSorted to db
async function pushIncidentsSorted(id) {
  let answersArr = [];
  // get all series incidents from db
  let incidentsArrDb = await SeriesIncidents.find({});
  incidentsArrDb.forEach((element) => {
    //sort the series into an array of objs
    if (answersArr.some((e) => e.series === element.series)) {
      let foundIndex = answersArr.findIndex((e) => e.series === element.series);

      //add incidents to existing obj or create new obj
      answersArr[foundIndex].incidents = answersArr[
        foundIndex
      ].incidents.concat(element.incidents);
    } else {
      answersArr.push({
        series: element.series,
        incidents: element.incidents,
        license_category: element.license_category,
        special_event_type: element.special_event_type,
        event_laps_complete: element.event_laps_complete,
        allowed_licenses: element.allowed_licenses,
        corners_per_lap: element.corners_per_lap,
      });
    }
  });

  // average the incidents
  let answersArrAvgd = [];
  answersArr.forEach((element) => {
    let inc_avg =
      element.incidents.reduce((a, b) => a + b, 0) / element.incidents.length;
    // exclude certain series
    console.log(element.series);

    answersArrAvgd.push({
      series: element.series,
      average_incidents: parseFloat(inc_avg.toFixed(2)),
      license_category: element.license_category,
      special_event_type: element.special_event_type,
      event_laps_complete: element.event_laps_complete,
      allowed_licenses: element.allowed_licenses,
      corners_per_lap: element.corners_per_lap,
    });
  });

  //remove nan from array
  answersArrAvgd = answersArrAvgd.filter((element) => {
    return !isNaN(element.average_incidents);
  });

  // sort the array by average incidents
  answersArrAvgd.sort((a, b) => {
    return b.average_incidents - a.average_incidents;
  });
  console.log(answersArrAvgd);

  // save to db obj
  var resultsObj = new IncidentsSorted({
    sorted_avgs: answersArrAvgd,
  });

  // save result to db
  resultsObj.save((err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log("incidents sorted saved to DB");
    }
  });
}
