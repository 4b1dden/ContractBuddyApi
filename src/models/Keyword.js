const _mongoose = require('mongoose')

module.exports = function(mongoose){
  return mongoose.model('Keyword', { 
    stem: {
      type: String,
      required: true
    },
    values: {
      type: Array,
      required: true
    },
    sampleWord: {
      type: String,
      required: false
    },
    clause: {
      type: _mongoose.Schema.Types.ObjectId,
      required: true
    }
  })
}
