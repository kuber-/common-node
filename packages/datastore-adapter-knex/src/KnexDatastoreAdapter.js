import knex from 'knex'
import knexify from './knexify'

export default class KnexDataStoreAdapter {
  /**
   * @param {object} options
   * @param {string} [options.tableName]
   * @param {object} [options.knexOptions]
   */
  constructor (options = {}) {
    this.options = options
  }

  async init ({ schema }) {
    const { knexOptions, tableName } = this.options
    this.schema = schema
    this.tableName = tableName || schema.name
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
    return this.getDBFromOptions(options).where('id', id).update(update.$set, '*').then(rows => rows[0])
  }

  async updateMany (filter, update, options) {
    return this.getDBFromOptions(options).where(filter).update(update.$set)
  }

  async deleteById (id, options) {
    const rowsAffected = await this.getDBFromOptions(options).where('id', id).delete()
    return rowsAffected > 0 && id
  }

  async deleteByIds (ids, options) {
    // TODO return deleted ids instead of count
    return this.getDBFromOptions(options).whereIn('id', ids).delete()
  }

  async deleteMany (filter, options) {
    return this.getDBFromOptions(options).where(filter).delete(filter)
  }

  async findById (id, options) {
    return this.getDBFromOptions(options).where('id', id).first()
  }

  async findByIds (ids, options) {
    return this.getDBFromOptions(options).whereIn('id', ids)
  }

  async findOne (filter, options) {
    return this.getDBFromOptions(options).where(filter).limit(1).first()
  }

  async find (filter, options) {
    return this.createCursor(filter, options)
  }

  async count (filter, options) {
    const result = await this.getDBFromOptions(options).where(filter).count('id')
    return result && result.length > 0 ? parseInt(result[0].count) : 0
  }

  async transaction (cb) {
    return this.db.transaction(cb)
  }

  createCursor (filter = {}, options) {
    const { $select, $limit, $offset, $sort, ...query } = filter
    const cursor = this.getDBFromOptions(options)
    knexify(cursor, query)

    // select
    if ($select) {
      cursor.select($select)
    }

    // limit
    if ($limit) {
      cursor.limit($limit)
    }

    // offset
    if ($offset) {
      cursor.offset($offset)
    }

    // sort
    if ($sort) {
      $sort.split(',').forEach(_sort => {
        if (_sort.indexOf('-') === 0) {
          cursor.orderBy(_sort.substring(1), 'desc')
        } else if (_sort.indexOf('+') === 0) {
          cursor.orderBy(_sort.substring(1), 'asc')
        } else {
          cursor.orderBy(_sort.substring(1), 'asc')
        }
      })
    }

    return cursor
  }
}
