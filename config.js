module.exports = {
  domain: '127.0.0.1',
  port: process.env.PORT || 3000,
  viewsPath: __dirname + '/views',
  publicPath: __dirname + '/public',
  uploadPath: __dirname + '/uploads',
  thresholdPerWord: 0.15,
  googleAuth: {
    clientId: '', // e.g. asdfghjkljhgfdsghjk.apps.googleusercontent.com
    clientSecret: '' // e.g. _ASDFA%DFASDFASDFASD#FAD-
  },
  version: 1
}