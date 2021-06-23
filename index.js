const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");
const { timeStamp } = require("console");

// const productPage = "https://getlatka.com/?first=25&offset=0&sort=ARR_max&sortDir=desc";
// const basePath = "https://getlatka.com";
const basePath = "https://getlatka.com/?first=1000&offset=";

async function getHTML(url) {
  const { data: html } = await axios.get(url).catch(() => {
    console.log("Couldn't get the page ☹️");
  });
  return html;
}

// JSON to CSV Converter
function ConvertToCSV(objArray) {
  var array = typeof objArray != "object" ? JSON.parse(objArray) : objArray;
  var str = "";

  for (var i = 0; i < array.length; i++) {
    var line = "";
    for (var index in array[i]) {
      if (line != "") line += ",";

      line += array[i][index];
    }

    str += line + "\r\n";
  }

  return str;
}

function scrapCompanies(html) {
  const $ = cheerio.load(html); //First you need to load in the HTML
  const companyNames = [];
  $("table > tbody > tr ").each(function (i, el) {
    var children = $(this).children();

    var row = {
      name: $(children[0])
        .find($("div > a:nth-child(2)"))
        .text()
        .replace(/,/g, " "),
      revenue: parseNumber($(children[1]).text()),
      funding: parseNumber($(children[2]).find($("div")).text()),
      cashFlow: parseNumber($(children[3]).find($("span")).text()),
      founder: $(children[4]).text(),
      teamSize: parseNumber($(children[5]).text()),
      customers: parseNumber($(children[6]).text()),
      acv: parseNumber($(children[7]).text()),
      age: parseNumber($(children[8]).text()),
      location: $(children[9]).text(),
      industry: $(children[10]).text(),
      statusAsOf: $(children[11]).text(),
    };
    companyNames[i] = row;
  });
  console.log(companyNames);
  return companyNames;
}

(async () => {
  var companyList = [];
  for (let i of [0, 1000, 2000, 3000, 4000, 5000]) {
    var html = await getHTML(basePath + i);
    companyList = companyList.concat(scrapCompanies(html));
  }

  // Convert Object to JSON
  var jsonObject = JSON.stringify(companyList);
  fs.writeFile("latka_data.json", jsonObject, function (err) {
    if (err) {
      console.log(err);
    }
  });

  // Convert JSON to CSV & Display CSV
  csv = ConvertToCSV(jsonObject);
  fs.writeFile("latka_data.csv", csv, function (err) {
    if (err) {
      console.log(err);
    }
  });
})();

function parseNumber(s) {
  var matched = s.match(/[0-9.]+[MKB]?/);
  if (matched == null || matched.length == 0) {
    return 0;
  }
  matched = matched[0];
  switch (matched.slice(-1)) {
    case "B":
      return matched.substring(0, matched.length - 1) * 1000000000;
    case "M":
      return matched.substring(0, matched.length - 1) * 1000000;
    case "K":
      return matched.substring(0, matched.length - 1) * 1000;
    default:
      return matched * 1;
  }
}
