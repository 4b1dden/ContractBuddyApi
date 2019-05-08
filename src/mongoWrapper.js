module.exports = function(config){
  const mongoose = require('mongoose')

  mongoose.connect(config.mongoConnectionString, { useNewUrlParser: true }, (err) => {
    if (err) throw err;
    else console.log("DB connection established.");
  })

  return {
    mongoose,
  }
}