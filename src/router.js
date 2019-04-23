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
  const path = require('path');
  const analyser = require("./services/analysis");

  const app = express.Router();

  const devDictionary = "keywords_dev.json";
  const prodDictionary = "keywords.json";

  // fixing cors error on client in dev env
  const prod = true;
  app.use(cors({origin: prod ? "https://contractbuddy.herokuapp.com" : "http://localhost:4200"}));
  app.options('*', cors());

  app.post('/getHighlights/text', (req, res) => {
    const threshold = req.body["threshold"] || config.wordAverageThreshold;
    const rawText = req.body.text;
    const analysis = analyser.analyseTextByValues(rawText);
    if (rawText) {
        let html = highlighter.GetHighlightsHTML(analysis, threshold);
        let highlights = highlighter.GetHighlights(rawText);

        return responseHandler.sendSuccessResponse(res, {
            rawHtml: html,
            highlights: highlights
        });
    } else {
        return responseHandler.sendErrorResponse(res, constants.ERROR_RESPONSES.NO_TEXT_PROVIDED);
    }
  });

  app.post('/getNotifications', (req, res) => {
    const rawText = req.body.text;
    if (rawText) {
        let notifications = highlighter.GetNotifications(rawText);

        return responseHandler.sendSuccessResponse(res, {
            date: notifications.date,
            period: notifications.priorPeriod,
        });
    } else {
        return responseHandler.sendErrorResponse(res, constants.ERROR_RESPONSES.NO_TEXT_PROVIDED);
    }
  });

  app.get("/", (req, res) => {
      res.send("service running");
  })

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
  });

  app.post("/dev/keywords/dictionary/analyse", (req, res) => {
      const text = req.body.text;
      const threshold = req.body.threshold || config.threshold;
      const keywords = require(path.join(__dirname, devDictionary));
      const analysis = analyser.injectCustomKeywordsForAnalysis(text, keywords);  

      return analysis ?
        responseHandler.sendSuccessResponse(res, analysis) :
        responseHandler.sendErrorResponse(res, "COULD_NOT_ANALYSE_TEXT");    
  });

  app.get("/dev/keywords/dictionary", (req, res) => {
      const dict = require(path.join(__dirname, devDictionary));
      return dict ? 
        responseHandler.sendSuccessResponse(res, dict) : 
        responseHandler.sendErrorResponse(res, "COULD_NOT_LOAD_DICTIONARY");
  });

  app.get("/dev/threshold", (req, res) => {
      return responseHandler.sendSuccessResponse(res, {threshold: config.threshold});
  });

  app.post("/dev/keywords/dictionary", (req, res) => {
      const newDict = req.body.newDict;
      fs.writeFile(path.join('src', devDictionary), JSON.stringify(newDict, null, 4), (err) => {
          return err ? 
            responseHandler.sendErrorResponse(res, "COULD_NOT_WRITE_TO_DEV_DICT", err) :
            responseHandler.sendSuccessResponse(res)
      });
  });

  app.get("/dev/keywords/dictionary/override", (req, res) => {
      const devDict = require(devDictionaryPath);
      const authToken = req.headers["auth_token"];

      fs.writeFile(prodDictionaryAPath, JSON.stringify(devDict), (err) => {
          return err ? 
            responseHandler.sendErrorResponse(res, "COULD_NOT_WRITE_TO_PROD_DICT", err) :
            responseHandler.sendSuccessResponse(res);
      });
  });

  return app
}