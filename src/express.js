module.exports = (config, ocr, db) => {
  var express = require('express')
  var bodyParser = require('body-parser')

  var googleAuth = require('./services/googleAuth.js')(config, db)
  var router = require('./router.js')(config, ocr)
  var app = express()

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://contractbuddy.herokuapp.com");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  
  app.set('view engine', 'ejs')
  app.set('views', config.viewsPath)

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(express.static(config.publicPath))

  app.use('/google', googleAuth)
  app.use('/', router)

  app.listen(config.port)

  return {}
}