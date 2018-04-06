const pick = require('lodash/pick')
const omit = require('lodash/omit')

/**
 * @typedef {Object} EventEmitterConfig
 * @property {string} [config.success] event to trigger on success
 * @property {string} [config.error] event to trigger on error
 * @property {Array} [config.pick] picks only fields mentioned in this array, similar to lodash pick. One of pick or omit
 * @property {Array} [config.omit] omits all fields mentioned in this array, similar to lodash omit. One of pick or omit
 */

/**
 * @param {Object} ctx action context
 * @param {EventEmitterConfig} config
 * @param {*} res response from action
 * @returns {Object}
 */
const getEventData = (ctx, config, res) => {
  // prepare event data
  let eventData = (config.pick || config.omit) ? { ...ctx.params, ...res } : res
  if (config.pick) {
    eventData = pick(eventData, config.pick)
  } else if (config.omit) {
    eventData = omit(eventData, config.omit)
  }

  return eventData
}

/**
 * middleware for emitting event on action success or fail
 * expects to have action.eventEmitter set to EventEmitterConfig
 *
 * Example:
 *
 * const action = {
 *    handler,
 *    eventEmitter: { success: 'success_event' }
 * }
 *
 */
const actionEventEmitterMiddlewareCreator = () => (handler, action) => {
  if (!action.eventEmitter) {
    return handler
  }

  return (ctx) => {
    const config = action.eventEmitter
    const promise = handler(ctx)

    if (config.success) {
      promise.then(async (res) => {
        await ctx.emit(config.success, getEventData(ctx, config, res))
        return res
      })
    }

    if (config.error) {
      promise.catch(async (e) => {
        await ctx.emit(config.error, e)
        throw e
      })
    }

    return promise
  }
}

module.exports = actionEventEmitterMiddlewareCreator
