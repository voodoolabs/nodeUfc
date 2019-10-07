const mma = require('mma');
const prettyjson = require('prettyjson');
const async = require("async");
const fs = require('fs');
// Load the full build.
const _ = require('lodash');
// Load the FP build for immutable auto-curried iteratee-first data-last methods.
const fp = require('lodash/fp');
// Load method categories.
const array = require('lodash/array');
const object = require('lodash/fp/object');
// Cherry-pick methods for smaller browserify/rollup/webpack bundles.
const at = require('lodash/at');
const curryN = require('lodash/fp/curryN');

const l = require('./logger');

let rawdata = fs.readFileSync('fighters.json');
let rawFighters = JSON.parse(rawdata);  
let fighter_details = [];
let file = "results.json";

var fighterFetch = function(fighter, cb)
{
	mma.fighter(fighter.name, function(data, err)
	{
		if( err ) return cb({ message: 'Fetch Failed. ' + err}, null);
		
		cb(null, data);
	});	
}

var fetchFighterDetail = function(fighters = rawFighters)
{
	l.debug("FIGHTER DETAIL CALL");
	let count = 0;
	async.eachLimit( fighters, 50, function(fighter, callback)
	{
		// try calling apiMethod 3 times, waiting 200 ms between each retry
		async.retry({
		  times: 2,
		  interval: 3000,
		}, fighterFetch.bind(null, fighter), function(fetchErr, result) {
			if (fetchErr) l.error(fetchErr)
	    	writeToFile(result, function(fileErr, fileRes)
    		{
    			count++;
	    		callback();
    		});
		});

	}, function(err)
	{
		l.info(count, "TOTAL PUSHED")
		l.info(JSON.parse(fs.readFileSync(file, 'utf-8')).length, "FILE LENGTH")
	    err ? console.log('A file failed to process. ' + err) : console.log("Completed! Check Results.json");
	});
}

var writeToFile = function(result, cb)
{
	try {
		objects = JSON.parse(fs.readFileSync(file, 'utf-8'));
		objects.push(result);
	} catch(err) {
		console.log(err);
		return;
	}
	
	fs.writeFileSync(file, JSON.stringify(objects), 'utf-8');
	cb();
}

module.exports = fetchFighterDetail;

// fetchFighterDetail(rawFighters);