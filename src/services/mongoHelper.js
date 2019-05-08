const Clause = require('../models/Clause');
const Keyword = require('../models/Keyword');

module.exports.buildClausesDb = function (keywords) {
    return new Promise (
        function (r) {
            const promises = keywords.map(clauseWrap => {
                return new Promise (
                    function (resolve, reject) {
                        const instance = new Clause({name: clauseWrap.clause});
                        instance.save((err) => {
                            if (err) reject(err)
                            else resolve(instance)
                        })
                    }
                )
            });
        
            Promise.all(promises).then(finish => {
                console.log("Finished building database");
                r(finish);
            });
        }
    )
   
}

module.exports.insertKeywords = async function (keywords) {
    const clauses = await Clause.find().lean();
    let clauseMap = {}
    for (let i = 0; i < clauses.length; i++) {
        clauseMap[clauses[i].name] = clauses[i]._id;
    }

    return new Promise (
        function (r) {
            const promises = keywords.map(clauseWrap => {
                return new Promise (
                    function (resolve, reject) {
                        const keys = Object.keys(clauseWrap.keywords);
                        let _p = keys.map(key => {
                            return new Promise((_r) => {
                                let values = clauseWrap.keywords[key];
                                let keyword = new Keyword({
                                    stem: key,
                                    values: values,
                                    sampleWord: "",
                                    clause: clauseMap[clauseWrap.clause]
                                });
                                keyword.save(err => {
                                    if (!err) _r(keyword)
                                    else console.log(err);
                                })
                            })
                        })

                        Promise.all(_p).then(f => {
                            resolve(f);
                        })
                    }
                )
            })

            Promise.all(promises).then(_f => {
                r(_f);
            }) 
        }
    )
}