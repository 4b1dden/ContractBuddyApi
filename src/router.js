module.exports = (config, ocr, db) => {
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
  const mongoHelper = require('./services/mongoHelper');

  const app = express();                 // define our app using express
  const router = express.Router();       // get an instance of the express Router

  const devDictionary = "keywords_dev.json";
  const prodDictionary = "keywords.json";

  // fixing cors error on client in dev env
  const prod = true;
  app.use(cors({origin: prod ? "https://contractbuddy.herokuapp.com" : "http://localhost:4200"}));
  app.options('*', cors());


  app.get("/", (req, res) => {
    res.send("service running");
  });

  router.post('/highlights', (req, res) => {
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

  router.post('/notifications', (req, res) => {
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

  router.post('/ocr/upload', (req, res) => {
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

  var Docs = db.mongoose.model('Doc', { name: String, content: String, dates: [Number], comment: String })

  function saveDoc(name, content, dates, comment){
    (new Docs({ name, content, dates, comment })).save()
  }

  router.get('/dev', (req, res) => {
    res.send('yep, dev')
  })
  router.post('/dev/uploadDoc', (req, res) => {
    saveDoc(req.body.name.toString(), req.body.content.toString(), req.body.dates, req.body.comment)

    res.send('sure')
  })
  router.post('/dev/getDoc', async (req, res) => {
    res.json(await Docs.findOne({ name: req.body.name }))
  })
  router.post('/dev/getDocsNames', async (req, res) => {
    res.json((await Docs.find()).map(c => c.name))
  })
  router.post("/dev/env/weight", (req, res) => {
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

  router.get("/dev/keywords/dictionary", (req, res) => {
      const dict = require(path.join(__dirname, devDictionary));
      return dict ? 
        responseHandler.sendSuccessResponse(res, dict) : 
        responseHandler.sendErrorResponse(res, "COULD_NOT_LOAD_DICTIONARY");
  });

  router.post("/dev/keywords/dictionary", (req, res) => {
      const text = req.body.text;
      const threshold = req.body.threshold || config.threshold;
      const keywords = require(path.join(__dirname, devDictionary));
      const analysis = analyser.injectCustomKeywordsForAnalysis(text, keywords);  

      return analysis ?
        responseHandler.sendSuccessResponse(res, analysis) :
        responseHandler.sendErrorResponse(res, "COULD_NOT_ANALYSE_TEXT");    
  });

  router.put("/dev/keywords/dictionary", (req, res) => {
      const newDict = req.body.newDict;
      fs.writeFile(path.join('src', devDictionary), JSON.stringify(newDict, null, 4), (err) => {
          return err ? 
            responseHandler.sendErrorResponse(res, "COULD_NOT_WRITE_TO_DEV_DICT", err) :
            responseHandler.sendSuccessResponse(res, newDict)
      });
  });

  router.get("/dev/threshold", (req, res) => {
      return responseHandler.sendSuccessResponse(res, {threshold: config.threshold});
  });

  router.get("/dev/keywords/dictionary/override", (req, res) => {
      const devDict = require(devDictionaryPath);
      const authToken = req.headers["auth_token"];

      fs.writeFile(prodDictionaryAPath, JSON.stringify(devDict), (err) => {
          return err ? 
            responseHandler.sendErrorResponse(res, "COULD_NOT_WRITE_TO_PROD_DICT", err) :
            responseHandler.sendSuccessResponse(res);
      });
  });

  router.get("/dev/keywords/db/clauses/upload", (req, res) => {
      const keywords = require(path.join(__dirname, devDictionary));
      mongoHelper.buildClausesDb(keywords).then(f => {
          res.status(200)
          res.send("Finished building db")
          console.log("Finished building db");
      })     
  });

  router.get("/dev/keywords/db/keywords/upload", (req, res) => {
      const keywords = require(path.join(__dirname, devDictionary));
      mongoHelper.insertKeywords(keywords).then(f => {
          res.status(200);
          res.send("finished inserting keywords to db")
          console.log("finished inserting keywords to db")
      }).catch(e => console.log(e));
  })

  app.use('/api', router);
  
  return app;
}