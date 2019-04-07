module.exports = (config, ocr) => {
  var express = require('express')
  var bodyParser = require('body-parser')

  var router = require('./router.js')(config, ocr)
  var app = express()
  
  app.set('view engine', 'ejs')
  app.set('views', config.viewsPath)

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(express.static(config.publicPath))

  app.use('/', router)

  var auth = require('./services/googleAuth')(config, app)

  app.listen(config.port)

  return {}
}