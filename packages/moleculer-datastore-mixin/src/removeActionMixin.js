import { createApiValidationError } from './errors'

const action = () => async function removeAction (ctx) {
  const { id, ids } = ctx.params

  if (ids) {
    return this.deleteByIds(ctx, ids)
  } else if (id) {
    return this.deleteById(ctx, id)
  }

  return Promise.reject(createApiValidationError('id or ids are required'))
}

const removeActionMixin = (actionName = 'remove') => ({
  actionName,
  handler: action(),
  params: {
    id: { type: 'string', optional: true },
    ids: { type: 'array', optional: true }
  }
})

export default removeActionMixin
