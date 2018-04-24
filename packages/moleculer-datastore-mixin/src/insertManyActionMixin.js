const action = () => async function insertManyAction (ctx) {
  const { entities } = ctx.params

  return this.insertMany(ctx, entities)
}

const insertManyActionMixin = (actionName = 'insertMany') => ({
  actionName,
  handler: action(),
  params: {
    entities: { type: 'array', items: 'object' }
  }
})

export default insertManyActionMixin
