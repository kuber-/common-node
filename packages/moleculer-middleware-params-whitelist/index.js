const pick = require('lodash/pick')

/**
 * @typedef {Object|Array} WhiteListConfig
 */

/**
 * Adds whitelist property in ctx.params
 *
 * @param {Object} ctx action context
 * @param {WhiteListConfig} config
 */
function addWhitelistParamsToCtx (ctx, config) {
  if (Array.isArray(config)) {
    ctx.params.whitelist = pick(ctx.params, config)
  } else {
    const keys = Object.keys(config)
    const whitelist = {}
    keys.forEach((key) => {
      whitelist[key] = pick(ctx.params, config[key])
    })

    ctx.params.whitelist = whitelist
  }
}

/**
 * middleware for picking whitelisted params
 * expects to have action.whitelist set to WhiteListConfig
 *
 * Example 1: whitelist is array
 *
 * const action = {
 *    handler,
 *    whitelist: ['id', 'name']
 * }
 *
 * ctx.params.whitelist => { id: '1231', name: 'abc' }
 *
 * Example 2: whitelist is object
 *
 * const action = {
 *    handler,
 *    whitelist: { myKey: ['id', 'name'] }
 * }
 *
 * ctx.params.whitelist => { myKey: { id: '1231', name: 'abc' } }
 */
const actionParamsWhitelistMiddlewareCreator = () => (handler, action) => {
  if (!action.whitelist) {
    return handler
  }

  return (ctx) => {
    addWhitelistParamsToCtx(ctx, action.whitelist)
    return handler(ctx)
  }
}

module.exports = actionParamsWhitelistMiddlewareCreator
