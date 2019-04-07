function ParsePdf(pdf, callback){
    var pdfParser = new PDFParser()
    
    pdfParser.loadPDF(pdf)
    
    pdfParser.on('pdfParser_dataError', errData => console.error(errData.parserError))

    pdfParser.on('pdfParser_dataReady', pdfData => {
      callback(PdfToText(pdfData))
    })
}

function PdfToText(json){
    var Output = ''

    json.formImage.Pages.forEach(c => {
      c.Texts.forEach(c => {
        c.R.forEach(c => {
          Output += decodeURIComponent(c.T) + '\n'
        })
      })
    })

    return Output
}

module.exports = {
    ParsePdf,
    PdfToText
}