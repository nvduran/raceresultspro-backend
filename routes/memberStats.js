const express = require("express");
const router = express.Router();
const MemberYearly = require("../models/MemberYearly");
const MemberInfo = require("../models/MemberInfo");
const IRSorted = require("../models/IRSorted");
const IncidentsSorted = require("../models/IncidentsSorted");
const fetch = require("node-fetch");
var cors = require("cors");
const bodyParser = require("body-parser");
var loginCookies = "";
var CryptoJS = require("crypto-js");
var AES = require("crypto-js/aes");
var SHA256 = require("crypto-js/sha256");
var Base64 = require("crypto-js/enc-base64");

getAuth();

async function getAuth() {
  console.log("AUTH ms");
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
    // setTimeout(async () => await starter(), 3000);
  }
  if (statusCode == 503) {
    // delay = maintenceDelay;
  }
  loginCookies = parseCookies(accessReply);
  return statusCode;
}

function parseCookies(response) {
  const raw = response.headers.raw()["set-cookie"];
  return raw
    .map((entry) => {
      const parts = entry.split(";");
      const cookiePart = parts[0];
      // console.log("parseCookies" + cookiePart);

      return cookiePart;
    })
    .join(";");
}

// GET ALL RESULTS
router.get("/yearly", async (req, res) => {
  try {
    const result = await MemberYearly.find();
    res.json(result);
  } catch (err) {
    res.json({ message: err });
  }
});

// GET ALL MEMBER INFOS
router.get("/info", async (req, res) => {
  try {
    const result = await MemberInfo.find();
    res.json(result);
  } catch (err) {
    res.json({ message: err });
  }
});

// career route since yearly is actually career... change yearly later
router.get("/career", async (req, res) => {
  try {
    const result = await MemberYearly.find();
    res.json(result);
  } catch (err) {
    res.json({ message: err });
  }
});
// career route since yearly is actually career... change yearly later
router.get("/career/:cust_id", async (req, res) => {
  try {
    const result = await MemberYearly.find({ cust_id: req.params.cust_id });

    if (result.length == 0) {
      loadMemToDB(req.params.cust_id);
      res.json(result);
    } else {
      res.json(result);
    }
  } catch (err) {
    res.json({ message: err });
  }
});

// GET SPECIFIC CUST RESULTS /memberstats/yearly/123456
router.get("/yearly/:cust_id", async (req, res) => {
  try {
    const result = await MemberYearly.find({ cust_id: req.params.cust_id });

    if (result.length == 0) {
      loadMemToDB(req.params.cust_id);
      res.json(result);
    } else {
      res.json(result);
    }
  } catch (err) {
    res.json({ message: err });
  }
});

// GET SPECIFIC CUST INFO /memberstats/info/123456
router.get("/info/:cust_id", async (req, res) => {
  try {
    // search db member infos by cust_id
    const result = await MemberInfo.find({ cust_id: req.params.cust_id });
    // if not found, look up member info and push to db
    if (result.length == 0) {
      memberInfoLookup(req.params.cust_id);

      res.json(result);
      // else if member info found, check if updated recently
    } else {
      console.log(result[0].cust_id);
      let today = new Date().toISOString().slice(0, 10);

      let custID1 = result[0].cust_id;

      // if not last updated today, update member info
      if (result[0].last_updated !== today) {
        updateMemberInfo(custID1);
        res.json(result);
      } else {
        res.json(result);
      }
    }
  } catch (err) {
    res.json({ message: err });
  }
});

// "all member yearly stats on the db /memberstats/api/yearlyarray"
router.get("/api/yearlyarray", async (req, res) => {
  try {
    let allYearliesArray = [];
    console.log("GETTING ALL YEARLIES");
    await MemberYearly.find()
      .then((results) => {
        allYearliesArray = results;
        return allYearliesArray;
      })
      .catch((err) => {
        console.log(err);
      });
    res.json(allYearliesArray);
  } catch (err) {
    res.json({ message: err });
  }
});

//sorted array of iratings /memberstats/api/irsorted
router.get("/api/irsorted", async (req, res) => {
  try {
    let allYearliesArray = [];
    let iRatingArray = [];
    let onlyActiveRatings = [];
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
          } else {
            // console.log(element.cust_id + " has no iRating data");
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
    // for (let i = 0; i < iRatingArray.length; i++) {
    //   const element = iRatingArray[i];
    //   // if not active since 2020, skip over them
    //   if (element.when.charAt(2) === "2") {
    //     onlyActiveRatings.push(element.value);
    //   }
    // }
    onlyActiveRatings.sort((a, b) => b - a);
    console.log(onlyActiveRatings);
    res.json(onlyActiveRatings);
  } catch (err) {}
});

// /memberstats/api/incidentssorted
router.get("/api/incidentssorted", async (req, res) => {
  try {
    console.log("getting sorted incidents array");
    await IncidentsSorted.find()
      .then((results) => {
        res.json(results);
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
  }
});

// road irating array /memberstats/api/roadirating
router.get("/api/roadirating", async (req, res) => {
  try {
    await IRSorted.find()
      .then((results) => {
        res.json(results[0].Arr);
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {}
});

router.get("/api/ovalirating", async (req, res) => {
  try {
    await IRSorted.find()
      .then((results) => {
        res.json(results[0].OvalArr);
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {}
});

router.get("/api/dirtirating", async (req, res) => {
  try {
    await IRSorted.find()
      .then((results) => {
        res.json(results[0].DirtArr);
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {}
});

router.get("/api/dirtovalirating", async (req, res) => {
  try {
    await IRSorted.find()
      .then((results) => {
        res.json(results[0].DirtOvalArr);
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {}
});

// look up member yearly stats and send to pushMemberYearly
async function loadMemToDB(memId) {
  let url =
    "https://members-ng.iracing.com/data/stats/member_career?cust_id=" +
    memId.toString();

  try {
    let accessReply = await fetch(url, {
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

      pushMemberYearly(resultsBody);
    }
    return "Member not found?";
  } catch (error) {
    console.error(error.message);
    console.error(error.stack);
    return "Lookup Error";
  }
}

// push member yearly stats to DB
async function pushMemberYearly(stats) {
  // assign model and values to result object
  var resultsObj = new MemberYearly({
    stats: [
      {
        category_id: stats.stats[0].category_id,
        category: stats.stats[0].category,
        starts: stats.stats[0].starts,
        wins: stats.stats[0].wins,
        top5: stats.stats[0].top5,
        poles: stats.stats[0].poles,
        avg_start_position: stats.stats[0].avg_start_position,
        avg_finish_position: stats.stats[0].avg_finish_position,
        laps: stats.stats[0].laps,
        laps_led: stats.stats[0].laps_led,
        avg_incidents: stats.stats[0].avg_incidents,
        avg_points: stats.stats[0].avg_points,
        win_percentage: stats.stats[0].win_percentage,
        top5_percentage: stats.stats[0].top5_percentage,
        laps_led_percentage: stats.stats[0].laps_led_percentage,
        total_club_points: stats.stats[0].total_club_points,
      },
      {
        category_id: stats.stats[1].category_id,
        category: stats.stats[1].category,
        starts: stats.stats[1].starts,
        wins: stats.stats[1].wins,
        top5: stats.stats[1].top5,
        poles: stats.stats[1].poles,
        avg_start_position: stats.stats[1].avg_start_position,
        avg_finish_position: stats.stats[1].avg_finish_position,
        laps: stats.stats[1].laps,
        laps_led: stats.stats[1].laps_led,
        avg_incidents: stats.stats[1].avg_incidents,
        avg_points: stats.stats[1].avg_points,
        win_percentage: stats.stats[1].win_percentage,
        top5_percentage: stats.stats[1].top5_percentage,
        laps_led_percentage: stats.stats[1].laps_led_percentage,
        total_club_points: stats.stats[1].total_club_points,
      },
      {
        category_id: stats.stats[2].category_id,
        category: stats.stats[2].category,
        starts: stats.stats[2].starts,
        wins: stats.stats[2].wins,
        top5: stats.stats[2].top5,
        poles: stats.stats[2].poles,
        avg_start_position: stats.stats[2].avg_start_position,
        avg_finish_position: stats.stats[2].avg_finish_position,
        laps: stats.stats[2].laps,
        laps_led: stats.stats[2].laps_led,
        avg_incidents: stats.stats[2].avg_incidents,
        avg_points: stats.stats[2].avg_points,
        win_percentage: stats.stats[2].win_percentage,
        top5_percentage: stats.stats[2].top5_percentage,
        laps_led_percentage: stats.stats[2].laps_led_percentage,
        total_club_points: stats.stats[2].total_club_points,
      },
      {
        category_id: stats.stats[3].category_id,
        category: stats.stats[3].category,
        starts: stats.stats[3].starts,
        wins: stats.stats[3].wins,
        top5: stats.stats[3].top5,
        poles: stats.stats[3].poles,
        avg_start_position: stats.stats[3].avg_start_position,
        avg_finish_position: stats.stats[3].avg_finish_position,
        laps: stats.stats[3].laps,
        laps_led: stats.stats[3].laps_led,
        avg_incidents: stats.stats[3].avg_incidents,
        avg_points: stats.stats[3].avg_points,
        win_percentage: stats.stats[3].win_percentage,
        top5_percentage: stats.stats[3].top5_percentage,
        laps_led_percentage: stats.stats[3].laps_led_percentage,
        total_club_points: stats.stats[3].total_club_points,
      },
    ],
    cust_id: stats.cust_id,
  });
  // save result to db
  resultsObj.save((err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Member yearly result saved to DB");
      memberInfoLookup(resultsObj.cust_id);
    }
  });
}

// look up member info and send to pushMemberInfo
async function memberInfoLookup(cust_id) {
  console.log("memberInfoLookup");
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
    console.log(accessReply.headers.get("x-ratelimit-remaining"));

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
    updateIratingData(member.cust_ids[0]);
  } else {
    // save result to db
    resultsObj.save((err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log("memberInfo result saved to DB");
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

async function getiRatingLinkData(cust_id) {
  let url =
    "https://members-ng.iracing.com/data/member/chart_data?cust_id=" +
    cust_id +
    "&category_id=2" +
    "&chart_type=1";

  try {
    let accessReply = await fetch(url, {
      method: "get",
      headers: { Accept: "application/json", cookie: loginCookies },
      cache: "no-store",
    });

    var replyBody = await accessReply.json();
    var statusCode = await accessReply.status;

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
      console.log(accessReply.headers.get("x-ratelimit-remaining"));
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
      console.log(accessReply.headers.get("x-ratelimit-remaining"));
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
      console.log(accessReply.headers.get("x-ratelimit-remaining"));
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

module.exports = router;
