
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
 */
const actionErrorMapperMiddlewareCreator = (config) => (handler, action) => {
  if (!action.errorMap && !config) {
    return handler
  }

  return (ctx) => {
    return handler(ctx).then((response) => {
      if (response.success) {
        return response
      }

      if (action.errorMap && action.errorMap[response.error]) {
        response.error = action.errorMap[response.error]
      }

      if (config.errorMap && config.errorMap[response.error]) {
        response.error = config.errorMap[response.error]
      }

      return response
    })
  }
}

module.exports = actionErrorMapperMiddlewareCreator
