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

const analyseTextByValues = (content, customKeywords) => {
    if (typeof content != "string") return [];

    const keywords = customKeywords || require("../keywords.json");
    const tooltips = require('../tooltips.json');
    let results = [];
    let sentences = content.split(".");
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

function hasNumber(s) {
    return /\d/.test(s);
}

const analyseTextByRules = (content) => {
    if (typeof content != "string") return [];
    let s = (a) => stemr.stem(a);

    let results = [];
    let sentences = content.split(".");
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
    analyseText,
    analyseTextByValues,
    analyseTextByRules,
    injectCustomKeywordsForAnalysis
}