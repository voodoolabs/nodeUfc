const Twit = require('twit')
const _ = require('lodash');
const l = require('./logger');
const fs = require('fs');
const async = require("async");

let consumer_key = "o75KIHOV7SgbjbEUEHURMFoG4"
let consumer_secret = "QisB0pBoURZ9pBLLw0V6iHOxY5AQlaIc8jUECgCZAA4Uqqwhdj"
let access_token = "538765768-6r7HjgnHMPdPEaoIjaY8EbVN93no4bxYRbh1etbt"
let access_token_secret = "QRcAOsOi2BcQPSKJLTjnrRuRrlQ8lEUJ92M4gZROXpLsS"


const T = new Twit({
  consumer_key:         consumer_key,
  consumer_secret:      consumer_secret,
  access_token:         access_token,
  access_token_secret:  access_token_secret,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  strictSSL:            true,     // optional - requires SSL certificates to be valid.
})

let uids = JSON.parse(fs.readFileSync('twitterdata.json'));
let file = fs.readFileSync('results.json');
let fighterData = _(JSON.parse(file))
	.filter( (i) => !!i )
	// .filter( (i) => !!i.description )
	.filter( (i) => i.age < 35 && i.fights.length > 9)
	.map( (i) => _.set(i, 'name', _.toLower(i.name)) )
	.map( (i) => _.mapValues(i, (f) => _.set(f, 'opponent', _.toLower(f.opponent) )))
	.uniqWith( _.isEqual )
	.orderBy('wins.total', 'desc')
	.value()


var follData = function(tweet_fighter, cb)
{
	T.get('followers/list', {
		screen_name: tweet_fighter.screen_name,
		skip_status: true,
		count: 200,
		include_user_entities: false
	},  function (follErr, follData, follRes) {
		
		if (follErr) {
			l.error(follErr);
		}
		
		if (follData && follData.users)
		{
			tweet_fighter['followers'] = _.map(follData.users, function(item){
	  			return _.pick(item, ["id", "name", "screen_name"])
	  		});
		}
		
		cb(null, tweet_fighter);
		
	})
}

var tlData = function(tweet_fighter, cb)
{
	T.get('statuses/user_timeline', {
		screen_name: tweet_fighter.screen_name,
		count: 200,
		trim_user: true,
		include_rts: true
	},  function (tlErr, tlData, tlRes) {
		
		if (tlErr) l.error(tlErr);

		if (tlData) tweet_fighter['tweet_data'] = tlData;

		cb(null, tweet_fighter);
		
	})
}
var tweetData = function(fighter, cb)
{
	// T.get('application/rate_limit_status', (limErr, limData, limRes) => l.info(limData)); return;
	
	T.get('users/search', { q: fighter.name, count: 10 }, function(err, data, res){
		if (err) {l.error(err, 'users search error'); cb(err);}
		if (data.length > 0){
			
			let keys = [
				"lang", "id","screen_name", "followers_count","friends_count",
				"description","listed_count","favourites_count",
				"statuses_count","verified"
			];
			
			let tweet_fighter = _.pick(_.first(data), keys);
			
			if (tweet_fighter.lang == 'en')
			{
			    tlData(tweet_fighter, function(err, result)
			    {
			    	if (err) l.error(err, "TL DATA ERROR");
			    	cb(null, result);
			    })
			}
			else
				cb('not english');

		}
		else
		{
			cb("no tweet data");
		}
	})
}

var fightersTweetData = function(fighters = rawFighters)
{
	async.eachLimit( fighters, 1, function(fighter, callback)
	{
		// try calling apiMethod 3 times, waiting 200 ms between each retry
		async.retry({
		  times: 2,
		  interval: 1000,
		}, tweetData.bind(null, fighter), function(fetchErr, data, result) {

			if (fetchErr) {l.debug(fetchErr, "tweet data err");}
			
			if (data)
			{
		    	extendToFile(fighter, data, function(appendErr, appendRes)
	    		{
					if (appendErr) callback(appendErr);
	    			
	    			callback();
	    		});
			}
			else
				callback();

		});

	}, function(err)
	{
	    err ? l.error('Something went wrong. ' + err) : l.info("Success FILE LENGTH");
	});
}


var extendToFile = function(fighter, data, cb)
{

	var res = _.assign({}, fighter, data);

	// l.warn(res, "ALL COMBINED");

	try {
		objects = JSON.parse(fs.readFileSync("twitterdata.json", 'utf-8'));
		objects.push(res);
	} catch(err) {
		l.error(err, "EXTEND TO FILE ERROR");
		return;
	}
	
	fs.writeFileSync("twitterdata.json", JSON.stringify(objects), 'utf-8');
	
	cb(null, res);
}

// fightersTweetData(fighterData.slice(250,300));
// l.info(uids.length)
// l.info(JSON.stringify(fighterData.slice(0, 100)))

fs.writeFileSync("500res.json", JSON.stringify(fighterData.slice(0, 500)), 'utf-8')

// l.debug(JSON.stringify(fighterData.slice(0,4)));
