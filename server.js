var config = require('./config.js')
var ocr = require('./src/services/ocr')(config)
var expressWrapper = require('./src/express')(config, ocr)

console.log('Code loaded, version: ' + config.version);
console.log(`App running on port ${config.port}`);