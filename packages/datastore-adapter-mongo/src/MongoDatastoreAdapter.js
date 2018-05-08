import mongodb from 'mongodb'

export default class MongoDataStoreAdapter {
  /**
   * @param {object} options
   * @param {string} options.url
   * @param {string} options.dbName
   * @param {string} [options.collectionName]
   * @param {object} [options.mongoOptions]
   */
  constructor (options = {}) {
    this.options = options
  }

  async init ({ schema }) {
    const { url, mongoOptions, dbName, collectionName } = this.options
    // collectionName is useful when we want to use one collection for each tenant
    // not that we will use this
    this.schema = schema
    this.collectionName = collectionName || schema.name
    this.client = await mongodb.MongoClient.connect(url, mongoOptions)
    this.db = this.client.db(dbName)
    this.collection = this.db.collection(this.collectionName)
  }

  mapDocFromMongo (doc) {
    const mappedDoc = {
      ...doc,
      id: doc._id && doc._id.toString ? doc._id.toString() : doc._id
    }

    delete mappedDoc._id
    return mappedDoc
  }

  mapDocsFromMongo (docs) {
    return docs.map(this.mapDocFromMongo.bind(this))
  }

  mapDocToMongo (doc) {
    const { id, ...data } = doc
    return {
      _id: id ? mongodb.ObjectID(id) : undefined,
      ...data
    }
  }

  mapDocsToMongo (docs) {
    return docs.map(this.mapDocToMongo.bind(this))
  }

  async insertOne (doc, options) {
    const mongoDoc = this.mapDocToMongo(doc)
    const { ops, insertedCount } = await this.collection.insertOne(mongoDoc, options)
    return insertedCount > 0 && this.mapDocFromMongo(ops[0])
  }

  async insertMany (docs, options) {
    const mongoDoc = this.mapDocsToMongo(docs)
    const { ops, insertedCount } = await this.collection.insertMany(mongoDoc, options)
    return insertedCount > 0 && this.mapDocsFromMongo(ops)
  }

  async updateById (id, update, options) {
    const { value } = await this.collection.findOneAndUpdate({ _id: mongodb.ObjectID(id) }, update, Object.assign({
      returnOriginal: false
    }, options))
    return !!value && this.mapDocFromMongo(value)
  }

  async deleteById (id, options) {
    const { value } = await this.collection.findOneAndDelete({ _id: mongodb.ObjectID(id) }, options)
    return !!value && this.mapDocFromMongo(value).id
  }

  async deleteByIds (ids, options) {
    const deletedIds = await Promise.all(ids.map(id => this.deleteById(id, options)))
    return deletedIds.filter(id => !!id)
  }

  async findById (id, options) {
    const doc = await this.collection.findOne({ _id: mongodb.ObjectID(id) }, options)
    return this.mapDocFromMongo(doc)
  }

  async findByIds (ids, options) {
    return this.find({
      _id: {
        $in: ids.map(id => mongodb.ObjectID(id))
      }
    }, options)
  }

  async findOne (filter, options) {
    const docs = await this.find(Object.assign({}, filter, { $limit: 1 }), options)
    return docs && docs.length > 0 && docs[0]
  }

  async find (filter, options) {
    const docs = await this.createCursor(filter, options).toArray()
    return this.mapDocsFromMongo(docs)
  }

  async count (filter, options) {
    const { $select, $limit, $offset, $sort, ...query } = filter
    const count = this.collection.count(query, options)
    return count
  }

  async raw () {
    return this.collection
  }

  createCursor (filter = {}, options) {
    const { $select, $limit, $offset, $sort, ...query } = filter
    const cursor = this.collection.find(query, options)

    // select
    if ($select) {
      const mongoSelect = {}
      $select.split(',').forEach((key) => {
        mongoSelect[key] = 1
      })
      cursor.project(mongoSelect)
    }

    // limit
    if ($limit) {
      cursor.limit($limit)
    }

    // offset
    if ($offset) {
      cursor.skip($offset)
    }

    // sort
    if ($sort) {
      const mongoSort = {}
      $sort.split(',').forEach(_sort => {
        if (_sort.indexOf('-') === 0) {
          mongoSort[_sort.substring(1)] = -1
        } else if (_sort.indexOf('+') === 0) {
          mongoSort[_sort.substring(1)] = 1
        } else {
          mongoSort[_sort] = 1
        }
      })

      cursor.sort(mongoSort)
    }

    return cursor
  }
}
