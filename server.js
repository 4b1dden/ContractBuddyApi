var config = require('./config.js')
var ocr = require('./src/services/ocr')(config)
var db = require('./src/mongoWrapper')(config)
var expressWrapper = require('./src/express')(config, ocr, db)

console.log('Code loaded, version: ' + config.version)
console.log(`App running on port ${config.port}`)