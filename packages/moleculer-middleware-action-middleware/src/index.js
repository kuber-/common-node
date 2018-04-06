import compose from 'koa-compose'

const actionMiddlewareCreator = () => (handler, action) => {
  return action.use ? compose([...action.use, handler]) : handler
}

export default actionMiddlewareCreator
