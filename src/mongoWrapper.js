module.exports = function(config){
  const mongoose = require('mongoose')

  mongoose.connect(config.mongoConnectionString, { useNewUrlParser: true })
  mongoose.

  const User = require('./models/User.js')(mongoose)

  return {
    mongoose,
    User
  }
}