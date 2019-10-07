const fs = require('fs');
const _ = require('lodash');
const l = require('./logger');
const leven = require('leven');
const getData = require('./get_data');

let fullNameFile = fs.readFileSync('fighters.json');
let myFile = fs.readFileSync('results.json');

// let fullNameList = _(JSON.parse(fullNameFile))
// 	.filter( (i) => !!i)
// 	.map( (i) => _.mapKeys( i, (v, k) => _.toLower(k) ) )
// 	.map( (i) => _.set(i, 'name', _.toLower(i.name)) )
// 	.sortBy('name')
// 	.value()

let myList = _(JSON.parse(myFile))
	.filter( (i) => !!i )
	.map( (i) => _.set(i, 'name', _.toLower(i.name)) )
	.map( (i) => _.mapValues(i, (f) => _.set(f, 'opponent', _.toLower(f.opponent) )))
	.uniqWith( _.isEqual )
	.sortBy('name')
	.value()

hasDot = (n) => _.includes(n.name, '.');

// let missingFighters = _.differenceBy(fullNameList, myList, 'name')

// getData(missingFighters);

// l.info(fullNameList);
// l.info(fullNameList[0]);
// l.info(fullNameList[10]);
// l.info(typeof(fullNameList));
// l.info(fullNameList.slice(0,10));
// l.info(fullNameList.length);
// l.silly(myList.slice(0,3));
l.silly(myList[0]);
// l.verbose(missingFighters);

