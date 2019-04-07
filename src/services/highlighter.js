const analyser = require("./analysis");
const tooltips = require("../tooltips.json");

function GetHighlights(content){
    return analyser.analyseText(content)
}

function GetHighlightsHTML(content, threshold){
    var output = ''
    var analysis = analyser.analyseText(content)

    analysis.forEach(sentenceObject => {
        console.log(JSON.stringify(sentenceObject.sentence));
        sentenceObject.sentence = sentenceObject.sentence.split(" ").map(word => {
            if (tooltips[word]) {
                word = `<a href='#' title="${tooltips[word]}">${word}</a>`
            }
            return word
        }).join(' ');

        if(sentenceObject.wordAverage >= threshold && (sentenceObject.sentence.length != 1 && isNaN(sentenceObject.sentence))){
            output += '<font style="background-color: yellow;">' + sentenceObject.sentence + '.</font> '
        } else {
            output += sentenceObject.sentence + '. '
        }
    })

    return output;
}

module.exports = {
    GetHighlights,
    GetHighlightsHTML
}