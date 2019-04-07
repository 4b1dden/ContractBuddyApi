module.exports = function(mongoose){
  return mongoose.model('User', { id: String, googleData: {} })
}