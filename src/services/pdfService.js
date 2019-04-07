const PDFParser = require('pdf2json');

function ParsePdf(pdf, callback){
    var pdfParser = new PDFParser()

    console.log(pdf);
    
    pdfParser.loadPDF(pdf)
    
    pdfParser.on('pdfParser_dataError', errData => console.error(errData.parserError))

    pdfParser.on('pdfParser_dataReady', pdfData => {
        console.log("data ready");
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