// @see https://github.com/feathersjs-ecosystem/feathers-knex/blob/master/lib/index.js
import isPlainObject from 'is-plain-object'

const METHODS = {
  $or: 'orWhere',
  $ne: 'whereNot',
  $in: 'whereIn',
  $nin: 'whereNotIn'
}

const OPERATORS = {
  $lt: '<',
  $lte: '<=',
  $gt: '>',
  $gte: '>=',
  $like: 'like',
  $ilike: 'ilike'
}

export default function knexify (query, params, parentKey) {
  Object.keys(params || {}).forEach(key => {
    const value = params[key]

    if (isPlainObject(value)) {
      return knexify(query, value, key)
    }

    // const self = this;
    const column = parentKey || key
    const method = METHODS[key]
    const operator = OPERATORS[key] || '='

    if (method) {
      if (key === '$or') {
        const self = this

        return query.where(function () {
          return value.forEach((condition) => {
            // @see http://knexjs.org/#Builder-where
            // inside where this refers to query builder
            this.orWhere(function () {
              self.knexify(this, condition)
            })
          })
        })
      }
      // eslint-disable-next-line no-useless-call
      return query[method].call(query, column, value)
    }

    return operator === '=' ? query.where(column, value) : query.where(column, operator, value)
  })
}
