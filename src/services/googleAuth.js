module.exports = (config, db) => {
  var express = require('express')
  var jwt = require('jsonwebtoken')
  var google = require('googleapis').google

  var app = express.Router()

  var defaultScope = [
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/userinfo.email'
  ]

  function GetOrCreateUser(jwt_payload, callback){
    db.User.findOne({ id: jwt_payload.sub }, function(err, user){
      if(err) return callback(err, false)

      if(user){
        return callback(null, user)
      }else if(jwt_payload){
        user = new db.User({ id: jwt_payload.sub, googleData: jwt_payload })

        user.save()

        return callback(null, user)
      }else{
        return callback(null, false)
      }

      console.log(user)
    })
  }

  function createConnection(){
    return new google.auth.OAuth2(config.googleAuth.clientId, config.googleAuth.clientSecret, 'http://' + config.domain + '/google/return')
  }
  function getConnectionUrl(auth){
    return auth.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: defaultScope
    })
  }
  function getGooglePlusApi(auth){
    return google.plus({ version: 'v1', auth })
  }
  function urlGoogle(){
    const auth = createConnection()
    const url = getConnectionUrl(auth)
    return url
  }
  async function getGoogleAccountFromCode(code){
    const auth = createConnection()
    const data = await auth.getToken(code)
    const tokens = data.tokens
    auth.setCredentials(tokens)
    const plus = getGooglePlusApi(auth)
    const me = await plus.people.get({ userId: 'me' })
    const userGoogleId = me.data.id
    const userGoogleEmail = me.data.emails && me.data.emails.length && me.data.emails[0].value

    return {
      id: userGoogleId,
      email: userGoogleEmail,
      tokens: tokens,
    }
  }

  app.get('/login', (req, res) => {
    return res.redirect(getConnectionUrl(createConnection()))
  })
  app.get('/return', async (req, res) => {
    if(!req.query.code) return res.send('Error')

    var cUser = await getGoogleAccountFromCode(req.query.code)
    
    if(!cUser) return res.send('Error')

    console.log(cUser)

    var sign = jwt.sign({ data: cUser }, config.sessionSecret, { expiresIn: 60 * 60 })

    res.send(sign)
  })
  app.get('/data', async (req, res) => {
    if(!req.query.jwt) return res.send('Error')

    var decoded = jwt.verify(req.query.jwt, config.sessionSecret)

    console.log(decoded.data)

    GetOrCreateUser(decoded.data, (err, user) => {
      res.json({ err, user })
    })
  })

  return app
}