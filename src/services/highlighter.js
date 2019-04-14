const analyser = require("./analysis");
const tooltips = require("../tooltips.json");

function GetHighlights(content){
    return analyser.analyseText(content)
}

function GetNotifications(content) {
    var regexpDateSentence = /\Termination [^.]+(3[01]|[12][0-9]|0?[1-9])\.(1[012]|0?[1-9])\.((?:19|20)\d{2})/igm
    var regexpDate = /(3[01]|[12][0-9]|0?[1-9])\.(1[012]|0?[1-9])\.((?:19|20)\d{2})/gm
    var regexpPriorSentence = [
        /\ ([0-9]+)\ days prior [^.]+ terminat/igm,
        /\ cancel [^.]+([0-9]+)[^.]+\ days[^.]+\ notice/igm,
        /([0-9]+)\ days[^.]+\ notice [^.]+ end/igm,
        /\ notice [^.]+\ ([0-9]+)\ days[^.]+\ end/igm,
        /([0-9]+)\ days[^.]+\ notice [^.]+\ terminat/igm,
        // /\ end [^.]+\ notice [^.]+ ([0-9]+)\ days/igm,
        /\ notice [^.]+ ([0-9]+)\ days/igm,
    ]
    var regexpPrior = /([0-9]+)/
    var regexAnyTime = [
        /\ may cancel [^.]+ any time/igm
    ];
    var dates = []
    var periods = []
    output = {}

    dates = dates.concat(content.match(regexpDateSentence))
    for (let i = 0; i < regexpPriorSentence.length; i++) {
        periods = periods.concat(content.match(regexpPriorSentence[i]));
    }
    for (let i = 0; i < regexAnyTime.length; i++) {
        if (content.match(regexAnyTime[i])) {
            periods = periods.concat(0);
        }
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
    if (periods.length > 0) {
        periods.forEach((item, i) => {
            if (item) {
                newPeriods[i] = item.match(regexpPrior)[0]
            }
            if (item === 0) {
                newPeriods[i] = 0;
            }
        });     
        newPeriods = newPeriods.filter ((value, index, array) => { 
            return array.indexOf (value) == index
        })
    }
    if (newPeriods.length === 1 && newDates.length === 1) {
        output.date = newDates[0]
        output.priorPeriod = newPeriods[0]
    }
    return output
}

function GetHighlightsHTML(content, threshold){
    output = {}
    output.html = '';
    output.highlights = '';
    var analysis = analyser.analyseText(content)

    analysis.forEach(sentenceObject => {
        sentenceObject.sentence = sentenceObject.sentence.split(" ").map(word => {
            if (tooltips[word]) {
                word = `<a href='javascript:void(0)' title="${tooltips[word]}">${word}</a>`
            }

            if (word.indexOf("\n") > -1) {
                word = word.replace("\n", "<br />");
            } 

            return word
        }).join(' ');

        if(sentenceObject.wordAverage >= threshold && (sentenceObject.sentence.length != 1 && isNaN(sentenceObject.sentence))){
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