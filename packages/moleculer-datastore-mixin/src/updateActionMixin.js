const action = () => async function updateAction (ctx) {
  const { id, ...update } = ctx.params

  // NOTE:
  // if update includes $set $unset etc., they will be passed to adapter
  // these have to be overriden in action middleware
  return this.updateById(ctx, id, update)
}

const updateActionMixin = (actionName = 'update') => ({
  actionName,
  handler: action(),
  params: {
    id: { type: 'string' }
  }
})

export default updateActionMixin
