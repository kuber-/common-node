const action = () => async function inserOneAction (ctx) {
  return this.insertOne(ctx, ctx.params)
}

const insertOneActionMixin = (actionName = 'insertOne') => ({
  actionName,
  params: {},
  handler: action()
})

export default insertOneActionMixin
