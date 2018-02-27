const action = () => async function createAction (ctx) {
  return this.insertOne(ctx, ctx.params)
}

const createActionMixin = (actionName = 'create') => ({
  actionName,
  params: {},
  handler: action()
})

export default createActionMixin
