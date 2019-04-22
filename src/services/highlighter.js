const analyser = require("./analysis");
const tooltips = require("../tooltips.json");

function GetHighlights(content){
    return analyser.analyseText(content)
}

function GetNotifications(content) {
    var regexpDateSentence = /\Termination [^.]+(3[01]|[12][0-9]|0?[1-9])\.(1[012]|0?[1-9])\.((?:19|20)\d{2})/igm
    var regexpDate = /(3[01]|[12][0-9]|0?[1-9])\.(1[012]|0?[1-9])\.((?:19|20)\d{2})/gm
    var regexpPriorSentence = [
        /([0-9]+) (?:[^ ]+ ){0,3}(day|week|month)s* prior (?:.(?!\. ))*terminat/igm,
        / cancel(?:.(?!\. ))* ([0-9]+) (?:[^ ]+ ){0,3}(day|week|month)(?:.(?!\. ))* notice/igm,
        /([0-9]+) (?:[^ ]+ ){0,3}(day|week|month)(?:.(?!\. ))* notice (?:.(?!\. ))+ end/igm,
        / notice(?:.(?!\. ))* ([0-9]+) (?:[^ ]+ ){0,3}(day|week|month)(?:.(?!\. ))+ end/igm,
        /([0-9]+) (?:[^ ]+ ){0,3}(day|week|month)(?:.(?!\. ))* notice (?:.(?!\. ))+ terminat/igm,
        / end (?:.(?!\. ))+ notice (?:.(?!\. ))* ([0-9]+) (?:[^ ]+ ){0,3}(day|week|month)/igm,
        // / notice (?:.(?!\. ))* ([0-9]+) (days|weeks|months)/igm,
    ]
    var regexpPriorDays = /([0-9]+) (?:[^ ]+ ){0,3}day/i
    var regexpPriorWeeks = /([0-9]+) (?:[^ ]+ ){0,3}week/i
    var regexpPriorMonths = /([0-9]+) (?:[^ ]+ ){0,3}month/i
    var regexpRemove = [
        / section ([0-9]+) /igm,
        / (?:[2-9]|\d\d\d*) day /igm
    ];
    var regexAnyTime = [
        / may cancel (?:.(?!\. ))+ any time/igm
    ];
    var dates = []
    var periods = []
    output = {}

    dates = dates.concat(content.match(regexpDateSentence))
    for (let i = 0; i < regexpPriorSentence.length; i++) {
        periods = periods.concat(content.match(regexpPriorSentence[i]));
    }

    var newDates = [];
    var newPeriods = [];

    if (dates.length > 0) {
        dates.forEach((item, i) => {
            if (item) {
                newDates[i] = item.match(regexpDate)[0]
            }
        });
        newDates = newDates.filter ((value, index, array) => { 
            return array.indexOf (value) == index
        })
    }
    console.log(periods)
    if (periods.length > 0) {
        periods.forEach((item, i) => {
            if (item) {
                regexpRemove.forEach((regexp) => {
                    item = item.replace(regexp, '')
                })
                if (item.match(regexpPriorDays)) {
                    newPeriods[i] = item.match(regexpPriorDays)[1]
                }
                if (item.match(regexpPriorWeeks)) {
                    newPeriods[i] = item.match(regexpPriorWeeks)[1] * 7
                }
                if (item.match(regexpPriorMonths)) {
                    newPeriods[i] = item.match(regexpPriorMonths)[1] + 'm'
                }
            }
        });     
        newPeriods = newPeriods.filter ((value, index, array) => { 
            return array.indexOf (value) == index
        })
    }

    if (newPeriods.length === 0) {
        for (let i = 0; i < regexAnyTime.length; i++) {
            if (content.match(regexAnyTime[i])) {
                newPeriods = [0];
            }
        }
    }
    console.log(newDates);
    console.log(newPeriods);
    if (newPeriods.length === 1) {
        output.priorPeriod = newPeriods[0]
    }
    if (newDates.length === 1) {
        output.date = newDates[0]
    }
    return output
}

function GetHighlightsHTML(analysis, threshold){
    output = {}
    output.html = '';
    output.highlights = '';

    analysis.forEach(sentenceObject => {
        sentenceObject.sentence = sentenceObject.sentence.split(" ").map(word => {
            // to eliminate edge cases where "sentence" with single number would be highlighted
            sentenceObject.ignore = sentenceObject.sentence.length <= 3 && !isNaN(sentenceObject.sentence);
            if (tooltips[word]) {
                word = `<a href='javascript:void(0)' title="${tooltips[word]}">${word}</a>`
            }

            if (word.indexOf("\n") > -1) {
                word = word.replace("\n", "<br />");
            } 

            return word
        }).join(' ');

        if(sentenceObject.analysis.totalWordAvg >= threshold && !sentenceObject.ignore) {
            output.html += '<font style="background-color: yellow;">' + sentenceObject.sentence + '.</font> '
            sentenceObjectReplaced = sentenceObject.sentence.replace('<br />', ' ')
            output.highlights += '<font style="background-color: yellow;">' + sentenceObjectReplaced + '.</font><br />'
        } else {
            output.html += sentenceObject.sentence + '. '
        }
    })
    return output;
}

module.exports = {
    GetNotifications,
    GetHighlights,
    GetHighlightsHTML
}