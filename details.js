var gsr = require('google-search-results-nodejs')
let serp = new gsr.GoogleSearchResults("34ce696305f55ddc7516e1aa16e7590e3fdb795244554c8c32228f123c580fdf")

serp.json({
 q: "Coffee", 
 location: "Austin, TX"
}, (result) => {
  console.log(result)
})