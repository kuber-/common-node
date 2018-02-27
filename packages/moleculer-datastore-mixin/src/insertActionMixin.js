const action = () => async function insertAction (ctx) {
  const { entities } = ctx.params

  return this.insertMany(ctx, entities)
}

const insertActionMixin = (actionName = 'insert') => ({
  actionName,
  handler: action(),
  params: {
    entities: { type: 'array', items: 'object' }
  }
})

export default insertActionMixin
