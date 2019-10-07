const rp = require('request-promise');
const request = require('request');
const axios = require('axios');
const $ = require('cheerio');
const l = require('./logger');
const _ = require('lodash');
const fs = require('fs');
const async = require("async");

let file = "rugbydata.json";

const base_url = "http://en.espn.co.uk"

// users to retrieve
const users = [
	"http://en.espn.co.uk/southafrica/rugby/player/14529.html",
	'http://en.espn.co.uk/southafrica/rugby/player/982.html',
	'http://en.espn.co.uk/france/rugby/player/1772.html',
	'http://en.espn.co.uk/argentina/rugby/player/7846.html'
];

// array to hold response
let response = [];

var aPromise = new Promise((resolve, reject) => {
  setTimeout(()=>{
    console.log("Done counting!");
  }, 2000)
});

async function getUsers(users) {
	try {
		response[0] = await axios.get(`${users[0]}`);
		response[1] = await axios.get(`${users[1]}`);
		response[2] = await axios.get(`${users[2]}`);
		response[3] = await axios.get(`${users[3]}`);
		l.info(response)
	} catch (err) {
		console.log(err);
	}
}
// async function fetchUsers() {
//   const user1 = axios.get(`${users[0]}`);
//   const user2 = axios.get(`${users[1]}`);
//   const user3 = axios.get(`${users[2]}`);
//   const user4 = axios.get(`${users[3]}`);
  
//   const results = await Promise.all([user1, user2, user3, use4]);
// }

res = getUsers(users);

l.info(res)