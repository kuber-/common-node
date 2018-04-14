import Datastore from '@google-cloud/datastore'
import uuid from 'uuid'
import defaultsDeep from 'lodash/defaultsDeep'
import keyBy from 'lodash/keyBy'

// const queryKeys = {
//   '$gt': '>',
//   '$gte': '>=',
//   '$lt': '<',
//   '$lte': '<=',
//   '$ne': '!=',
//   '=': '='
// }

export default class GoogleDatastoreAdapter {
  /**
   * @param {object} options
   * @param {object} [options.dsOptions]
   * @param {string} [options.namespace]
   * @param {string} [options.kind]
   * @param {function} [options.generateId]
   */
  constructor (options = {}) {
    this.options = options
  }

  async init ({ schema }) {
    const { namespace, kind, dsOptions, generateId } = this.options
    this.schema = schema
    this.kind = kind || this.schema.name
    this.namespace = namespace
    this.generateId = generateId || uuid.v4

    // datastore is scoped to namespace for multi tenancy
    this.datastore = new Datastore(Object.assign({}, dsOptions, { namespace }))
  }

  mapIdToKey (id) {
    if (this.datastore.isKey(id)) {
      return id
    }

    const path = id ? [this.kind, id] : [this.kind, this.generateId()]
    return this.datastore.key(path)
  }

  mapKeyToId (key) {
    // if id is string key.name is set, if id is number key.id is set
    return this.datastore.isKey(key) ? (key.id || key.name) : key
  }

  toArray (data) {
    return Array.isArray(data) ? data : [data]
  }

  mapDocFromDatastore (doc) {
    // check if doc is datastore doc
    if (doc.key && doc.data && this.datastore.isKey(doc.key)) {
      return {
        id: this.mapKeyToId(doc.key),
        ...doc.data
      }
    }

    const mappedDoc = {
      ...doc,
      id: this.mapKeyToId(doc[this.datastore.KEY])
    }

    delete mappedDoc[this.datastore.KEY]
    return mappedDoc
  }

  mapDocsFromDatastore (docs) {
    return docs.map(this.mapDocFromDatastore.bind(this))
  }

  mapDocToDatastore (doc) {
    // check if doc is datastore doc
    if (doc.key && doc.data && this.datastore.isKey(doc.key)) {
      return doc
    }

    const { id, ...data } = doc
    return {
      key: this.mapIdToKey(id),
      data
    }
  }

  mapDocsToDatastore (docs) {
    return docs.map(this.mapDocToDatastore.bind(this))
  }

  async insertOne (doc, options) {
    const datastoreDoc = this.mapDocToDatastore(doc)
    await this.datastore.insert(datastoreDoc)
    return this.mapDocFromDatastore(datastoreDoc)
  }

  async insertMany (docs, options) {
    const datastoreDocs = this.mapDocsToDatastore(docs)
    await this.datastore.insert(datastoreDocs)
    return this.mapDocsFromDatastore(datastoreDocs)
  }

  async updateById (id, update, options) {
    const transaction = this.datastore.transaction()
    const key = this.mapIdToKey(id)
    return new Promise((resolve, reject) => {
      transaction.run(async (err) => {
        if (err) {
          return reject(err)
        }
        const data = await transaction.get(key)
        const doc = this.mapDocFromDatastore(data[0])
        const newDoc = Object.assign({}, doc, update)
        const newDatastoreDoc = this.mapDocToDatastore(newDoc)
        await transaction.save(newDatastoreDoc)
        transaction.commit((err) => {
          if (err) {
            return reject(err)
          }

          resolve(newDoc)
        })
      })
    })
  }

  async updateMany (filter, update, options) {
    throw new Error('Not Implemented')
  }

  async deleteById (id, options) {
    const key = this.mapIdToKey(id)
    await this.datastore.delete(key)
    return 1
  }

  async deleteByIds (ids, options) {
    const keys = ids.map(this.mapIdToKey.bind(this))
    await this.datastore.delete(keys)
    return ids.length
  }

  async deleteMany (filter, options) {
    throw new Error('Not Implemented')
  }

  async findById (id, options) {
    const key = this.mapIdToKey(id)
    const data = await this.datastore.get(key)
    return this.mapDocFromDatastore(data[0])
  }

  async findByIds (ids, options) {
    const keys = ids.map(this.mapIdToKey.bind(this))
    const data = await this.datastore.get(keys)
    return this.mapDocsFromDatastore(data[0])
  }

  async findOne (filter, options) {
    return this.find(Object.assign({}, filter, { limit: 1 }), options)
  }

  async delete (ids, options) {
    ids = this.toArray(ids)
    const keys = ids.map(this.mapIdToKey.bind(this))

    // delete
    return this.datastore.delete(keys).then((data) => {
      const { mutationResults } = data[0]

      // map keys => ids
      return mutationResults.map((mutationResult, index) => {
        return {
          id: this.mapKeyToId(keys[index]),
          deleted: true,
          version: mutationResult.version
        }
      })
    }).catch((e) => console.log(e))
  }

  async update (docs, options) {
    // datastore requires full doc to be sent
    // so fetch the original docs and merge data
    docs = this.toArray(docs)
    const docsById = keyBy(docs, 'id')

    // if a document is not found it will not be returned in the array
    const fullDocs = await this.get(docs.map(doc => doc.id), options)
    const mergedDocs = fullDocs.map((fullDoc) => {
      return defaultsDeep(docsById[fullDoc.id], fullDoc)
    })

    return this.internalSave('update', mergedDocs, options)
  }

  async find (filter = {}, options) {
    // eslint-disable-next-line no-unused-vars
    const { $select, $limit, $offset, $sort, $startCursor, ...query } = filter
    const dsQuery = this.datastore.createQuery(this.kind)

    // select
    if ($select) {
      dsQuery.select($select.split(','))
    }

    // limit
    if ($limit) {
      dsQuery.limit($limit)
    }

    // offset
    if ($offset) {
      dsQuery.offset($offset)
    }

    // order
    if ($sort) {
      $sort.split(',').forEach(_sort => {
        if (_sort.indexOf('-') === 0) {
          dsQuery.order(_sort.substring(1), {
            descending: true
          })
        } else if (_sort.indexOf('+') === 0) {
          dsQuery.order(_sort.substring(1), {
            descending: false
          })
        } else {
          dsQuery.order(_sort)
        }
      })
    }

    // TODO filter
    // Object.keys(query)

    // cursor
    if ($startCursor) {
      dsQuery.start($startCursor)
    }

    // query
    return this.datastore.runQuery(dsQuery).then((data) => {
      return {
        docs: this.mapDocsFromDatastore(data[0]),
        info: data[1]
      }
    }).catch((e) => console.log(e))
  }

  async count () {
    throw new Error('Not Implemented')
  }
}
