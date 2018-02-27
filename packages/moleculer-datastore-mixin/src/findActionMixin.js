const action = () => async function findAction (ctx) {
  const { $count, ...filter } = ctx.params
  const docs = await this.find(ctx, filter)

  if ($count) {
    const count = await this.count(ctx, filter)
    return {
      docs,
      count
    }
  }

  return docs
}

const findActionMixin = (actionName = 'find') => ({
  actionName,
  handler: action(),
  params: {
    $select: { type: 'string', optional: true },
    $limit: { type: 'number', optional: true },
    $offset: { type: 'number', optional: true },
    $startCusror: { type: 'string', optional: true },
    $endCusror: { type: 'string', optional: true },
    $sort: { type: 'string', optional: true },
    $count: { type: 'boolean', optional: true }
  }
})

export default findActionMixin
