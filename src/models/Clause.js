const mongoose = require('mongoose')

module.exports = mongoose.model('Clause', { 
    name: {
          type: String,
          required: true
    }
})
