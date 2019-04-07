module.exports = (config) => {
  var fs = require('fs')
  var AWS = require('aws-sdk')
  
  AWS.config.update({
    region: 'eu-west-1',
    credentials: new AWS.Credentials({ accessKeyId: 'AKIAUFSGUYHGV2VUKOCI', secretAccessKey: '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' })
  })

  var rekognition = new AWS.Rekognition()
  
  function fileToBuffer(file){
    var bitmap = fs.readFileSync(file)

    return new Buffer(bitmap)
  }
  function ImageToText(buffer, callback){
    var params = {
      Image: {
        Bytes: buffer
      }
    }
  
    rekognition.detectText(params, (err, data) => {
      if(err) console.log(err, err.stack)
      
      var WholeText = data.TextDetections.reduce((cVar, cEntry) => cVar + ' ' + cEntry.DetectedText, '')
  
      callback(WholeText)
    })
  }

  return {
    fileToBuffer,
    ImageToText
  }
}
