import omit from 'lodash/omit'

const PROPERTIES = ['$select', '$limit', '$offset', '$startCursor', '$endCursor', '$sort']

function parse (number) {
  if (typeof number !== 'undefined') {
    return Math.abs(parseInt(number, 10))
  }
}

export default function (query) {
  let filters = {
    $select: query.$select,
    $limit: parse(query.$limit),
    $offset: parse(query.$offset),
    $startCursor: query.$startCursor,
    $endCursor: query.$endCursor,
    $sort: query.$sort
  }

  return { filters, query: omit(query, ...PROPERTIES) }
}
