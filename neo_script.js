const async = require("async");
const fs = require('fs');
// Load the full build.
const _ = require('lodash');
const l = require('./logger');
const Neode = require('neode');
const r = require("request");
const decypher = require('decypher');

const neo4j = require('neo4j-driver').v1;
let uri = "bolt://localhost:7687";
let query = decypher('./loadfighters.cql');

let file = fs.readFileSync('twitterdata.json');
let txtUrl = "http://localhost:7474/db/data/transaction/commit";
let remoteUrl = "bolt://db-hey3mwx3qmvofxlwtise.graphenedb.com:24787";

let localuser = "neo4j"; let localpw = "123";
let username = "mma"; let pw = "b.FZyTskh8ff8y.zkyZVYboaBYxXyTR";

var driver = neo4j.driver(remoteUrl, neo4j.auth.basic(username, pw));

let fighterData = _(JSON.parse(file))
	.filter( (i) => !!i && !!i.id)
	.map( (i) => _.set(i, 'name', _.toLower(i.name)) )
	.map( (i) => _.mapValues(i, (f) => _.set(f, 'opponent', _.toLower(f.opponent) )))
	.uniqWith( _.isEqual )
	.sortBy('name')
	.value()

let cb = function(err,data) {
	l.error(err);
	l.info(JSON.stringify(data));
}

let params = { json:fighterData };

var session = driver.session();

function remote(offset, limit, cb)
{
	l.debug(offset, " OFFSET VALUE")
	session
	    .run(query, { json: fighterData.slice(offset, offset+limit) })
	    .then(function(result) {
	        l.info(result.records.length, " number of fighters added")
	        session.close();
	        cb(null, result.records.length);
	    })
	    .catch(function(error) {
	        l.error(error);
	        session.close();
	    });
}

let offset = 0;
let limit = 50;

async.whilst(
    function() { return offset < fighterData.length; },
    function(callback) {
    	remote(offset, limit, function(err, res)
    	{
    		if (err) callback(err);
      		offset += res;
      		callback()
    	});
    },
    function (err) {
        err ? l.error(err, " WHILST ERROR") : l.info("Fighters done, CLOSING DRIVER")
		driver.close();
    }
);


