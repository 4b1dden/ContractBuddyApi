module.exports = {
  domain: '127.0.0.1:3000',
  port: process.env.PORT || 3000,
  viewsPath: __dirname + '/views',
  publicPath: __dirname + '/public',
  uploadPath: __dirname + '/uploads',
  thresholdPerWord: 0.15,
  sessionSecret: 'jfgdjkgvbhbasghfjibn',
  mongoConnectionString: 'mongodb+srv://dbUser:bejnamin222@cluster0-qshkb.mongodb.net/test?retryWrites=true',
  googleAuth: {
    clientId: '597771414846-f4u4jcjarmfugirtk0cah7g1aukopnsp.apps.googleusercontent.com', // e.g. asdfghjkljhgfdsghjk.apps.googleusercontent.com
    clientSecret: 'L1Nf6tOLvuoVzpwFZFahqKBL' // e.g. _ASDFA%DFASDFASDFASD#FAD-
  },
  version: 1,
  shouldHaveAllowCORS: true
}