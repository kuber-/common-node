const compose = require('koa-compose')

const actionMiddlewareCreator = () => (handler, action) => {
  return action.use ? compose([...action.use, handler]) : handler
}

module.exports = actionMiddlewareCreator
