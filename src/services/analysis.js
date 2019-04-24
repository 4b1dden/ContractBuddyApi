const fs = require('fs');
const fileName = "sampleContract.txt";
const stemr = require("stemr");

function translateWrittenNumbers(words) {
    let wordNumberMap = {
        "one": 1,
        "two": 2,
        "three": 3,
        "four": 4,
        "five": 5,
        "six": 6,
        "seven": 7,
        "eight": 8,
        "nine": 9,
        "zero": 0
    }
    for (let i = 0; i < words.length; i++) {
        if (wordNumberMap[words[i]]) words[i] = wordNumberMap[words[i]].toString();
    }
    return words;
}

function formatContent(content) {
    content = content.replace(/ \n/g, ' ');
    content = content.replace(/\n /g, ' ');
    content = content.replace(/\n \n/g, '\n');
    content = content.replace(/\n(\.|\:|\;|\,|\-|\))/g, '.');
    content = content.replace(/-\n/g, '-');
    content = content.replace(/\n([^ ]+)\n/g, ' $1 ');
    content = content.replace(/\n([b-z])\n/g, '$1 ');
    content = content.replace(/\n([b-z]) /g, '$1 ');
    content = content.replace(/\n([0-9]{4})\n/g, ' $1 ');
    content = content.replace(/\n(january|february|march|april|may|june|july|august|september|october|november|december)\n/ig, ' $1 ');
    content = content.replace(/ •/g, '\r\n•');
    content = content.replace(/•\n/g, '•');
    content = content.replace(/( |\n)([^a-z])\n/g, '\n \n$2\n');
    content = content.replace(/( |\n)([0-9]{1,2}\.? [A-Z])/g, '\n \n$2');
    content = content.replace(/( |\n)([0-9]{1,2}\.?)\n([A-Z])/g, '\n \n$2 $3');
    content = content.replace(/( |\n)([A-Z]\.? [A-Z])/g, '\n \n$2');
    content = content.replace(/( |\n)([A-Z]\.?)\n([A-Z])/g, '\n \n$2 $3');
    content = content.replace(/( |\n)([a-z]\. [A-Z])/g, '\n \n$2');
    content = content.replace(/( |\n)([a-z]\.)\n([A-Z])/g, '\n \n$2 $3');
    content = content.replace(/( |\n)(Part [0-9])/g, '\n \n$2');
    return content;
}

const analyseTextByValues = (content, customKeywords) => {
    
    content = formatContent(content);

    if (typeof content != "string") return [];

    const keywords = customKeywords || require("../keywords.json");
    const tooltips = require('../tooltips.json');
    let results = [];
    let sentences = content.split(". ");
    sentences.map(sentence => {
        let words = sentence.split(" ");
        let sentenceBreakdown = {
            sentence: sentence,
            analysis: {
                totalValue: 0,
                clauses: {}
            }, 
            tooltips: {}
        };

        keywords.map(collection => {
            sentenceBreakdown.analysis.clauses[collection.clause] = {
                value: 0,
                charAvg: 0,
                wordAvg: 0
            }
        });

        const keywordColumn = 0;
        const wordCount = sentenceBreakdown.sentence.trim().split(" ").length;
        const charCount = sentenceBreakdown.sentence.length;

        words.map(word => {
            word = word.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
            if (!word.endsWith("\n")) {
                let stem = stemr.stem(word).toLowerCase();
                keywords.map(collection => {
                    if (collection.keywords[stem]) {
                        sentenceBreakdown.analysis.clauses[collection.clause].value += collection.keywords[stem][keywordColumn];
                        sentenceBreakdown.analysis.clauses[collection.clause].charAvg += sentenceBreakdown.analysis.clauses[collection.clause].value / charCount;
                        sentenceBreakdown.analysis.clauses[collection.clause].wordAvg += sentenceBreakdown.analysis.clauses[collection.clause].value / wordCount;
                    }
                })
                
                if (tooltips[stem]) {
                    sentenceBreakdown.tooltips[stem] = tooltips[stem];
                }
            }
        });

        keywords.map(collection => sentenceBreakdown.analysis.totalValue += sentenceBreakdown.analysis.clauses[collection.clause].value);

        sentenceBreakdown.analysis.totalWordAvg = sentenceBreakdown.analysis.totalValue / wordCount;
        sentenceBreakdown.analysis.totalCharAvg = sentenceBreakdown.analysis.totalValue / charCount;

        results.push(sentenceBreakdown);
    });

    return results;
}

function getStatsForAnalysis(threshold, analysis) {
    let highlighted = 0;
    analysis.analysis.map(sentenceBreakdown => {
        if (sentenceBreakdown.totalWordAvg >= threshold) {
            sentenceBreakdown.isHighlighted = true;
            highlighted += 1;
        } 
        return sentenceBreakdown;
    });

    return {
        highlighted: highlighted
    }
}

function hasNumber(s) {
    return /\d/.test(s);
}

const analyseTextByRules = (content) => {
    if (typeof content != "string") return [];
    let s = (a) => stemr.stem(a);

    let results = [];
    let sentences = content.split(". ");
    sentences.map(sentence => {
        let sentenceBreakdown = {
            sentence: sentence,
            shouldHighlight: false
        };
        let words = sentence.split(" ").map(w => s(w));

        //extend-termination sentence rule
        // IF in a sentence the words ‘extend’ and AFTER this ‘terminate’
        let extendIndex = words.indexOf(s("extend"));
        let terminationIndex = words.indexOf(s("terminate"));
        if (extendIndex != -1 && extendIndex < terminationIndex) {
            sentenceBreakdown.shouldHighlight = true;
        }

        //word to number translation
        words = translateWrittenNumbers(words);

        let numbersIndex = [];
        for (let i = 0; i < words.length; i++) {
            try {
                let val = words[i].match(/\d+/g).map(Number);
                numbersIndex.push(i);
            } catch (err) {
                // nasty hack
            }
        }

        //extend period sentence rule
        // AFTER ‘extend’ Number/for a period of one month/by 3 months/for a further month
        let isNumberAfterExtend = numbersIndex.some(index => index > extendIndex);
        if (extendIndex != -1 && isNumberAfterExtend && ((words.indexOf("month") > -1 || words.indexOf("day") || words.indexOf("week")))) {
            // console.log('preslo extend period sentece rule');
            sentenceBreakdown.shouldHighlight = true;
        }

        //termination period rule
        // AFTER ‘extend’ and ‘terminate’ Number days/Number months
        let terminationPeriodRule = numbersIndex.some(value => value > extendIndex && value > terminationIndex);
        if (terminationIndex != -1 && extendIndex != -1 && terminationPeriodRule) {
            sentenceBreakdown.shouldHighlight = true;
            // console.log("preslo termination period rule");
        }

        results.push(sentenceBreakdown);
    });

    return results;
}

function analyseText(content){
    return analyseTextByValues(content)
}

function injectCustomKeywordsForAnalysis(content, keywords) {
    return typeof keywords == "object" ? analyseTextByValues(content, keywords) : [];
}

/*fs.readFile(fileName, 'utf8', (err, content) => {
    if (err) throw err;
    
    let semanticAnalysis = analyseTextByValues(content);
    console.log(semanticAnalysis);

    let ruleAnalysis = analyseTextByRules(content);
    console.log(ruleAnalysis);
});*/

module.exports = {
    getStatsForAnalysis,
    analyseText,
    analyseTextByValues,
    analyseTextByRules,
    injectCustomKeywordsForAnalysis,
    formatContent
}