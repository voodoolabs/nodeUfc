const rp = require('request-promise');
const request = require('request');
const $ = require('cheerio');
const l = require('./logger');
const _ = require('lodash');
const fs = require('fs');
const async = require("async");
const JSZip = require("jszip");
const zip = new JSZip();

let file = 'rugbydata.json';

const base_url = "http://en.espn.co.uk"

let playerFileData = _(JSON.parse(fs.readFileSync(file, 'utf-8')))
	.filter( (i) => !!i )
	.uniqWith( _.isEqual )
	.sortBy('name')
	.value()

let count = 0;

var run = function()
{
	countryUrls(function(err, data)
	{
		playerUrls(data);
	})
}

var countryUrls = function(cb)
{
	var countryUrls = [];
	request(base_url + '/scrum/rugby/player/index.html', function (error, response, body)
	{
	  	var names = $("#emptList li a.ScrumPanelBlueText1", body);
	    for (let i = 0; i < names.length; i++){
			if (i==2) continue;
			countryUrls.push({ url: names[i].attribs.href, players: []});
	    }
	    cb(null, countryUrls);
	});
}

var playerUrls = function(countries)
{
	l.info("player urls func run");
	async.eachLimit( countries, 2, function(country, callback)
	{
		// try calling apiMethod 3 times, waiting 200 ms between each retry
		async.retry({
		  times: 3,
		  interval: 5000,
		}, playersLinks.bind(null, country), function(fetchErr, result) {
			if (fetchErr) l.error(fetchErr)
			playersDetails(result, function(deetErr, deetRes)
			{
				if (deetErr) callback(deetErr);
				callback();
			})
		});

	}, function(err)
	{
		// l.info(result)
	    err ? console.log('A file failed to process. ' + err) : l.debug(fs.readFileSync('rugbydata.json').count, "Players added");
	});
}

var playersLinks = function(country, cb)
{
	request(base_url + country.url, function (error, response, body)
	{
		var players = $("#scrumPlayerContent td:nth-child(2) > a", body);
		players.each(function(i, elem){
			var debutYear = parseInt(_.last($(elem).parent().siblings().last().text().split(" ")));
			var pos = $(elem).parent().next().text();
			if (debutYear > 1999 && !playerFileData.includes(players[i].children[0].children[0].data)){
		 		var initialPlayer = {
		 			name: players[i].children[0].children[0].data,
		 			debut: debutYear,
		 			position: pos,
		 			link: players[i].attribs.href
		 		}
		 		country.players.push(initialPlayer);
			}
		})
		cb(null, country);
	});
}

var playersDetails = function(country, cb)
{
	async.eachLimit( country.players, 20, function(player, callback)
	{
		// try calling apiMethod 3 times, waiting 200 ms between each retry
		async.retry({
		  times: 3,
		  interval: 5000,
		}, playerInfo.bind(null, player), function(fetchErr, result) {
			if (fetchErr) l.error(fetchErr);

			writeToFile(result, function(fileErr, fileRes){
				if (fileErr) callback(fileErr);
				callback();
			});
		});

	}, function(err)
	{
		// l.warn("player details final callback");
		if (!err) cb(null, country);
	});
}


var playerInfo = function(player, cb)
{
	async.parallel([
	    playerData.bind(null, player),
	    playerMatches.bind(null, player),
	    playerStats.bind(null, player),
	],
	function(err, results) {
	    if (err) l.error(err, "PLAYER INFO ASYN CALLBACK")
		player = results[0];
		player.matches = results[1];
		player.career_stats = results[2];
	    // l.verbose(player, "PLAYER RESULTS FROM PARALELL");
		cb(null, player)
	});
}

var playerData = function(player, cb)
{
	request(base_url + player.link, function(error, response, body)
	{
		var playerInfo = $("div.scrumPlayerDesc", body);
		for (let i = 0; i < playerInfo.length; i++)
			if (playerInfo[i].children[0].type != 'text')
				player[_.camelCase($(playerInfo[i]).contents().first().text())] = $(playerInfo[i]).contents().last().text();

		cb(null, player)
	})
}

var playerStats = function(player, cb)
{
	let res = [];
	request(base_url + player.link + '?class=1;template=results;type=player', function(error, response, body)
	{
		let headlines = $("tr[class=head]", body)
			.children('th')
			.filter(function()
			{
				return !!$(this).text();
			})
			.map(function()
			{
				return $(this).text();
			}).get();
		
		let careerStats = $("tr[class=data1]", body);

		careerStats.each(function(i, elem)
		{
			if (i == 0)
			{
				let stats = $(elem).children()
				.slice(1,-1)
				.filter(function()
				{
					return !!$(this).text();
				})
				.map(function()
				{
					return $(this).text();
				}).get()


				let statObj = _.zipObject(headlines, stats);

				res.push(statObj);
			}
			
		})

		cb(null, res)
	})
}

var playerMatches = function(player, cb)
{
	let res = [];
	request(base_url + player.link + '?class=1;template=results;type=player;view=match', function(error, response, body)
	{
		let headlines = $("tr[class=headlinks]", body)
			.children('th')
			.filter(function()
			{
				return !!$(this).text();
			})
			.map(function()
			{
				return $(this).text();
			}).get();
	
		let matches = $("tr[class=data1]", body);
		matches.each(function(i, elem)
		{
			if (i > 0)
			{
				let stats = $(elem).children()
				.filter(function()
				{
					return !!$(this).text();
				})
				.map(function()
				{
					return $(this).text();
				}).get()


				let matchObj = _.zipObject(headlines, stats);

				res.push(matchObj);
			}
			
		})

		cb(null, res)
	})
}


var writeToFile = function(result, cb)
{
	try {
		objects = JSON.parse(fs.readFileSync(file, 'utf-8'));
		objects.push(result);
	} catch(err) {
		l.error(Object.key(err), "FILE WRITE ERROR");
		return
	}
	
	fs.writeFileSync(file, JSON.stringify(objects), 'utf-8');
	count++
	l.info('Successfully written to file', 'Number added: ' + count);
	cb(null, "Written to file");
}

// run()

l.debug(JSON.stringify(playerFileData.slice(0,5)));
// l.debug(playerFileData.length)
