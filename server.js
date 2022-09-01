const fetch = require("node-fetch"); //this may be outdated with the newest node.js, but plenty of docs exist for including other files
const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const app = express();
var cors = require("cors");
const bodyParser = require("body-parser");
var loginCookies = "";
const memberStatsRoute = require("./routes/memberStats");
const MemberYearly = require("./models/MemberYearly");
var CryptoJS = require("crypto-js");
var AES = require("crypto-js/aes");
var SHA256 = require("crypto-js/sha256");
var Base64 = require("crypto-js/enc-base64");

// CORS error fix
app.use(cors());

// middleware to parse res.body
app.use(bodyParser.json());

// ROUTING
app.use("/memberStats", memberStatsRoute);

mongoose.connect(process.env.DB_CONNECTION, () => {
  console.log("Connected to DB!");
});

getAuth();

app.get("/", (req, res) => {
  res.send("This is home page!");
});

async function getAuth() {
  var hash = CryptoJS.SHA256(
    process.env.IR_PASSWORD + process.env.IR_USERNAME.toLowerCase()
  );
  // The values in parenthesis evaluate to ("MyPassWord"+"clunky@iracing.com")
  // Notice the password value maintains its case, while the lowercase username is used here

  //Then we need to enc the hash in Base64
  var hashInBase64 = CryptoJS.enc.Base64.stringify(hash);
  console.log("AUTH");
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
    setTimeout(async () => await starter(), 3000);
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
      console.log("parseCookies" + cookiePart);

      return cookiePart;
    })
    .join(";");
}

//**********START**********
async function starter() {
  console.log("STARTING");
  getCarName();
}

// search car by ID
async function getCarName(carid) {
  var url = "https://members-ng.iracing.com/data/car/get";

  try {
    var accessReply = await fetch(url, {
      method: "get",
      headers: { Accept: "application/json", cookie: loginCookies },
      cache: "no-store",
    });

    var replyBody = await accessReply.json();
    var statusCode = await accessReply.status;
    var replyHeaders = await accessReply.headers;

    if (replyBody.link != null) {
      var resultLink = replyBody.link;

      const amazonReply = await fetch(resultLink, {
        method: "get",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      var carListBody = await amazonReply.json();

      return carListBody;
    }
    return "Car not found?";
  } catch (error) {
    console.error(error.message);
    console.error(error.stack);
    return "Lookup Error";
  }
}

app.listen(process.env.PORT || 3100, () => {
  console.log("Server started");
});
