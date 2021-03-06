import knex from 'knex'
import knexify from './knexify'

export default class KnexDataStoreAdapter {
  /**
   * @param {object} options
   * @param {string} [options.tableName]
   * @param {object} [options.knexOptions]
   * @param {string} [options.identifier = id]
   */
  constructor (options = {}) {
    this.options = options
  }

  async init ({ schema }) {
    const { knexOptions, tableName, identifier } = this.options
    this.schema = schema
    this.tableName = tableName || schema.name
    this.identifier = identifier || 'id'
    this.db = knex(knexOptions)
  }

  /**
   * If transaction is present in options returns transaction specific db object
   *
   * @param {*} options
   */
  getDBFromOptions (options) {
    return options && options.tx ? options.tx(this.tableName) : this.db(this.tableName)
  }

  async insertOne (doc, options) {
    return this.getDBFromOptions(options).insert(doc, '*').then(rows => rows[0])
  }

  async insertMany (docs, options) {
    return this.getDBFromOptions(options).insert(docs, '*')
  }

  async updateById (id, update, options) {
    return this.getDBFromOptions(options).where(this.identifier, id).update(update.$set, '*').then(rows => rows[0])
  }

  async deleteById (id, options) {
    const rowsAffected = await this.getDBFromOptions(options).where(this.identifier, id).delete()
    return rowsAffected > 0 && id
  }

  async deleteByIds (ids, options) {
    // TODO return deleted ids instead of count
    return this.getDBFromOptions(options).whereIn(this.identifier, ids).delete()
  }

  async findById (id, options) {
    return this.getDBFromOptions(options).where(this.identifier, id).first()
  }

  async findByIds (ids, options) {
    return this.getDBFromOptions(options).whereIn(this.identifier, ids)
  }

  async findOne (filter, options) {
    return this.createCursor({
      filters: {
        ...filter.filters,
        $limit: 1
      },
      query: filter.query
    }, options).first()
  }

  async find (filter, options) {
    return this.createCursor(filter, options)
  }

  async count (filter, options) {
    const result = await this.createCursor(filter, options).count(this.identifier)
    return result && result.length > 0 ? parseInt(result[0].count) : 0
  }

  async transaction (cb) {
    return this.db.transaction(cb)
  }

  async raw () {
    return this.db
  }

  createCursor (filter = {}, options) {
    const { filters, query } = filter
    const cursor = this.getDBFromOptions(options)
    knexify(cursor, query)

    // select
    if (filters.$select) {
      cursor.select(filters.$select.split(','))
    }

    // limit
    if (filters.$limit) {
      cursor.limit(filters.$limit)
    }

    // offset
    if (filters.$offset) {
      cursor.offset(filters.$offset)
    }

    // sort
    if (filters.$sort) {
      filters.$sort.split(',').forEach(_sort => {
        if (_sort.indexOf('-') === 0) {
          cursor.orderBy(_sort.substring(1), 'desc')
        } else if (_sort.indexOf('+') === 0) {
          cursor.orderBy(_sort.substring(1), 'asc')
        } else {
          cursor.orderBy(_sort, 'asc')
        }
      })
    }

    return cursor
  }
}
