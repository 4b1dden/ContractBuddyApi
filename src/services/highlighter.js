const analyser = require("./analysis");
const tooltips = require("../tooltips.json");

function GetHighlights(content){
    return analyser.analyseText(content)
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
    GetHighlights,
    GetHighlightsHTML
}