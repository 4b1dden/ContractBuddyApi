module.exports = (config, app) => {
  var google = require('googleapis')

  var googleConfig = {
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirect: 'https://' + config.domain + '/google-auth' // this must match your google api settings
  }
  var defaultScope = [
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/userinfo.email'
  ]

  var auth = new google.google.auth.OAuth2(googleConfig.clientId, googleConfig.clientSecret, googleConfig.redirect)

  function getConnectionUrl() {
    return auth.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // access type and approval prompt will force a new refresh token to be made each time signs in
      scope: defaultScope
    })
  }

  app.get('/googleLogin', (req, res) => {
    return res.redirect(getConnectionUrl())
  })

  return {}
}