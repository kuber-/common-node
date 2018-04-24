const action = () => async function updateByIdAction (ctx) {
  const { id, ...update } = ctx.params

  // NOTE:
  // if update includes $set $unset etc., they will be passed to adapter
  // these have to be overriden in action middleware
  return this.updateById(ctx, id, update)
}

const updateByIdActionMixin = (actionName = 'updateById') => ({
  actionName,
  handler: action(),
  params: {
    id: { type: 'string' }
  }
})

export default updateByIdActionMixin
