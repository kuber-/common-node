const action = () => async function countAction (ctx) {
  const { filter } = ctx.params
  return this.count(ctx, filter)
}

const countActionMixin = (actionName = 'count') => ({
  actionName,
  handler: action(),
  params: {
    $select: { type: 'string', optional: true },
    $limit: { type: 'number', optional: true },
    $offset: { type: 'number', optional: true },
    $startCusror: { type: 'string', optional: true },
    $endCusror: { type: 'string', optional: true },
    $sort: { type: 'string', optional: true }
  }
})

export default countActionMixin
