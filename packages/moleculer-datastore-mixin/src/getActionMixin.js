import { createApiValidationError } from './errors'

const action = () => async function getAction (ctx) {
  const { id, ids } = ctx.params

  if (ids) {
    return this.findByIds(ctx, ids)
  } else if (id) {
    return this.findById(ctx, id)
  }

  return Promise.reject(createApiValidationError('id or ids are required'))
}

const getActionMixin = (actionName = 'get') => ({
  actionName,
  handler: action(),
  params: {
    id: { type: 'string', optional: true },
    ids: { type: 'array', optional: true }
  }
})

export default getActionMixin
