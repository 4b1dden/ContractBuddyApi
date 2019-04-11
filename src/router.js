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
  const analyser = require("./services/analysis");

  const app = express.Router();

  // fixing cors error on client in dev env
  //app.use(cors({origin: "http://localhost:4200"}));
  app.use(cors({origin: "https://contractbuddy1.herokuapp.com"}));

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

  app.post("/dev/env/weight", (req, res) => {
      const threshold = req.body.threshold;
      const keywords = typeof req.body.keywords == "string" ? JSON.parse(req.body.keywords) : req.body.keywords;
      const text = req.body.text;

      if (threshold && keywords && text) {
          const analysis = analyser.injectCustomKeywordsForAnalysis(text, keywords);
          responseHandler.sendSuccessResponse(res, analysis);
      } else {
          return responseHandler.sendErrorResponse(res, constants.ERROR_RESPONSES.MISSING_PARAMETERS);
      }
  })

  return app
}