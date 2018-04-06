const createErrorResponse = (config, action, error, level = 1) => {
  if (
    !error.type &&
    config.mapEntityNotFoundToService !== false &&
    error.name === 'EntityNotFoundError'
  ) {
    error.type = `${action.service.name}.not_found`
  }

  if (level > 1) {
    return error
  }

  const errorResponse = {
    code: error.code,
    error: !error.code || (error.code && error.code >= 500) ? 'internal_error' : (error.type || error.name),
    data: error.data ? error.data : undefined,
    message: error.message ? error.message : undefined
  }

  if (action.errorMap && action.errorMap[errorResponse.error]) {
    errorResponse.error = action.errorMap[errorResponse.error]
  } else if (config.errorMap && config.errorMap[errorResponse.error]) {
    errorResponse.error = config.errorMap[errorResponse.error]
  }

  return errorResponse
}

const createSuccessResponse = (response) => response

/**
 *
 * Example:
 *
 * // global
 * errorMap: {
 *   EntityNotFoundError: 'not_found',
 *   ValidationError: 'validation_error'
 * }
 *
 * action can have same config which will override the global config
 * errorMap: {
 *   EntityNotFoundError: 'user_not_found'
 * }
 *
 * @param {Object} [config]
 * @param {Object} config.errorMap
 * @param {boolean} [config.mapEntityNotFoundToService]
 */
const actionResponseHandlerMiddlewareCreator = (config = {}) => (handler, action) => {
  return (ctx) => {
    return handler(ctx)
      .then((response) => createSuccessResponse(response))
      .catch((e) => {
        const errorResponse = createErrorResponse(config, action, e, ctx.level)

        if (!errorResponse.code || (errorResponse.code && errorResponse.code >= 500)) {
          ctx.broker.logger.error(e)
        }

        return ctx.level > 1 ? Promise.reject(errorResponse) : Promise.resolve(errorResponse)
      })
  }
}

module.exports = actionResponseHandlerMiddlewareCreator
