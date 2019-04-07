module.exports = (config, ocr) => {
  const express = require('express');
  const formidable = require('formidable');
  const tooltips = require('./tooltips.json');
  const PDFParser = require('pdf2json');
  const highlighter = require("./services/highlighter");
  const pdfService = require("./services/pdfService");
  const responseHandler = require('./services/responseHandler');
  const constants = require('./constants');
  const cors = require("cors");
  const fs = require('fs');

  const app = express.Router();

  // fixing cors error on client in dev env
//   app.use(cors({origin: "http://localhost:4200"}));
//   app.use(cors({origin: "https://contractbuddy.herokuapp.com"}));

    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

  app.post('/getHighlights/text', (req, res) => {
    const threshold = req.body["threshold"] || config.thresholdPerWord;
    const rawText = req.body.text;
    if (rawText) {
        let html = highlighter.GetHighlightsHTML(rawText, threshold);
        let highlights = highlighter.GetHighlights(rawText);

        return responseHandler.sendSuccessResponse(res, {
            rawHtml: html,
            highlights: highlights
        });
    } else {
        return responseHandler.sendErrorResponse(res, constants.ERROR_RESPONSES.NO_TEXT_PROVIDED);
    }
  });

  app.post('/ocr/upload', (req, res) => {
    var form = new formidable.IncomingForm()

    form.parse(req);

    form.on('fileBegin', (name, file) => {
        file.path = config.uploadPath + '/' + file.name;
    });

    form.on('file', (name, file) => {
      console.log('Uploaded ' + file.name);

      if(file.name.indexOf('.pdf') !== -1){
        pdfService.ParsePdf(file.path, text => {
            return responseHandler.sendSuccessResponse(res, {
                text
            })
        })
      } else {
        ocr.ImageToText(ocr.fileToBuffer(file.path), text => {
            return responseHandler.sendSuccessResponse(res, {
                text
            });
        })
      }
    })
  });

  return app
}