const has = require('lodash/has')

const createErrorResponse = (error) => {
  return {
    success: false,
    error: error.type || error.name,
    data: error.data
  }
}

const createSuccessResponse = (response) => {
  return {
    success: true,
    data: response
  }
}

const actionResponseHandlerMiddlewareCreator = () => (handler, action) => {
  return (ctx) => {
    return handler(ctx)
      .then((response) => {
      // if its already converted to response structure else where do not convert again
        return !has(response, 'success') ? createSuccessResponse(response) : response
      }).catch((e) => {
      // if its already converted to response structure else where do not convert again
        return !has(e, 'success') ? createErrorResponse(e) : e
      })
  }
}

module.exports = actionResponseHandlerMiddlewareCreator
