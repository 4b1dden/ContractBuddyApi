const mongoose = require('mongoose')

module.exports = mongoose.model('Keyword', { 
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
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  })
