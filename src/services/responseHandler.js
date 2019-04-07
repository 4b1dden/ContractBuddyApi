const sendErrorResponse = (res, message, trace) => {
    return res.json({
        isError: true,
        error: {
            message,
            trace
        }
    })
}

const sendSuccessResponse = (res, dataObject) => {
    return res.json({
        isError: false,
        data: dataObject
    })
}

module.exports = {
    sendErrorResponse, 
    sendSuccessResponse
}