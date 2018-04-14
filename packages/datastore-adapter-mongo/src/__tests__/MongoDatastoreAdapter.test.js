import MongoDatastoreAdapter from '../MongoDatastoreAdapter'
import mongodb from 'mongodb'

const defaultSchema = {
  name: 'defaultSchema'
}

const defaultOptions = {
  url: 'mockurl',
  dbName: 'mockdb',
  mongoOptions: {}
}

const connect = () => ({
  db: jest.fn(() => ({
    collection: jest.fn(() => collection())
  }))
})

const getDoc = (counter = 1) => ({
  name: `name-${counter}`
})

const getDocWithId = (id = 1, counter = 1) => ({
  id: `${id}`,
  ...getDoc(counter)
})

const docToMongo = (doc) => {
  const { id, ...data } = doc
  return {
    _id: id,
    ...data
  }
}

const collection = () => ({
  insertOne: jest.fn(() => ({
    insertedCount: 1,
    ops: [
      docToMongo(getDocWithId())
    ]
  })),

  insertMany: jest.fn(() => ({
    insertedCount: 2,
    ops: [
      docToMongo(getDocWithId(1, 1)),
      docToMongo(getDocWithId(2, 2))
    ]
  })),

  findOneAndUpdate: jest.fn(() => ({
    value: docToMongo(getDocWithId())
  })),

  updateMany: jest.fn(() => ({
    modifiedCount: 1
  })),

  findOneAndDelete: jest.fn(() => ({
    value: docToMongo(getDocWithId())
  })),

  deleteMany: jest.fn(() => ({
    deletedCount: 1
  })),

  findOne: jest.fn(() => docToMongo(getDocWithId())),

  find: jest.fn(() => ({
    project: jest.fn(),
    limit: jest.fn(),
    skip: jest.fn(),
    sort: jest.fn(),
    toArray: jest.fn(() => [
      docToMongo(getDocWithId(1, 1)),
      docToMongo(getDocWithId(2, 2))
    ])
  })),

  count: jest.fn(() => 1)
})

describe('MongoDatastoreAdapter', () => {
  let adapter = null

  beforeEach(() => {
    mongodb.MongoClient.connect = jest.fn(() => connect())
    adapter = new MongoDatastoreAdapter(defaultOptions)
    adapter.init({ schema: defaultSchema })
  })

  it('should have interface methods', () => {
    expect(adapter.init).toBeDefined()
    expect(adapter.insertOne).toBeDefined()
    expect(adapter.insertMany).toBeDefined()
    expect(adapter.updateById).toBeDefined()
    expect(adapter.updateMany).toBeDefined()
    expect(adapter.deleteById).toBeDefined()
    expect(adapter.deleteByIds).toBeDefined()
    expect(adapter.deleteMany).toBeDefined()
    expect(adapter.findById).toBeDefined()
    expect(adapter.findByIds).toBeDefined()
    expect(adapter.findOne).toBeDefined()
    expect(adapter.find).toBeDefined()
    expect(adapter.count).toBeDefined()
  })

  it('should have private methods', () => {
    expect(adapter.options).toEqual(defaultOptions)
    expect(adapter.mapDocFromMongo).toBeDefined()
    expect(adapter.mapDocsFromMongo).toBeDefined()
    expect(adapter.mapDocToMongo).toBeDefined()
    expect(adapter.mapDocsToMongo).toBeDefined()
  })

  describe('#init', () => {
    it('should connect to mongodb', () => {
      expect(mongodb.MongoClient.connect).toHaveBeenCalledTimes(1)
      expect(mongodb.MongoClient.connect).toHaveBeenCalledWith(defaultOptions.url, defaultOptions.mongoOptions)
      expect(adapter.client.db).toHaveBeenCalledWith(defaultOptions.dbName)
      expect(adapter.db.collection).toHaveBeenCalledWith(defaultSchema.name)
    })

    it('should populate instance values', () => {
      expect(adapter.schema).toBe(defaultSchema)
      expect(adapter.collectionName).toBe(defaultSchema.name)
      expect(adapter.client).toBeDefined()
      expect(adapter.db).toBeDefined()
      expect(adapter.collection).toBeDefined()
    })
  })

  describe('#insertOne', () => {
    it('should call collection#insertOne', async () => {
      expect.assertions(2)
      const doc = getDoc()
      const options = {}
      await adapter.insertOne(doc, options)
      expect(adapter.collection.insertOne).toHaveBeenCalledTimes(1)
      expect(adapter.collection.insertOne).toHaveBeenCalledWith(docToMongo(doc), options)
    })

    it('should return inserted doc', async () => {
      expect.assertions(1)
      const doc = getDoc()
      const insertedDoc = await adapter.insertOne(doc)
      expect(insertedDoc).toEqual(getDocWithId())
    })

    it('should return false id doc is not inserted', async () => {
      expect.assertions(1)
      const doc = getDoc()
      adapter.collection.insertOne = jest.fn(() => ({ insertedCount: 0 }))
      const insertedDoc = await adapter.insertOne(doc)
      expect(insertedDoc).toBe(false)
    })

    it('should convert doc to mongo', async () => {
      expect.assertions(2)
      const doc = getDoc()
      jest.spyOn(adapter, 'mapDocToMongo')

      await adapter.insertOne(doc)
      expect(adapter.mapDocToMongo).toHaveBeenCalledTimes(1)
      expect(adapter.mapDocToMongo).toHaveBeenCalledWith(doc)
    })

    it('should convert doc from mongo', async () => {
      expect.assertions(2)
      const doc = getDoc()
      jest.spyOn(adapter, 'mapDocFromMongo')

      await adapter.insertOne(doc)
      expect(adapter.mapDocFromMongo).toHaveBeenCalledTimes(1)
      expect(adapter.mapDocFromMongo).toHaveBeenCalledWith(docToMongo(getDocWithId()))
    })
  })

  describe('#insertMany', () => {
    it('should call collection#insertMany', async () => {
      expect.assertions(2)
      const docs = [getDoc(1), getDoc(2)]
      const options = {}
      await adapter.insertMany(docs, options)
      expect(adapter.collection.insertMany).toHaveBeenCalledTimes(1)
      expect(adapter.collection.insertMany).toHaveBeenCalledWith(docs.map(docToMongo), options)
    })

    it('should return inserted docs', async () => {
      expect.assertions(1)
      const docs = [getDoc(1), getDoc(2)]
      const insertedDocs = await adapter.insertMany(docs)
      expect(insertedDocs).toEqual([
        getDocWithId(1, 1),
        getDocWithId(2, 2)
      ])
    })

    it('should return false id docs are not inserted', async () => {
      expect.assertions(1)
      const docs = [getDoc(1), getDoc(2)]
      adapter.collection.insertMany = jest.fn(() => ({ insertedCount: 0 }))
      const insertedDocs = await adapter.insertMany(docs)
      expect(insertedDocs).toBe(false)
    })

    it('should convert docs to mongo', async () => {
      expect.assertions(2)
      const docs = [getDoc(1), getDoc(2)]
      jest.spyOn(adapter, 'mapDocsToMongo')

      await adapter.insertMany(docs)
      expect(adapter.mapDocsToMongo).toHaveBeenCalledTimes(1)
      expect(adapter.mapDocsToMongo).toHaveBeenCalledWith(docs)
    })

    it('should convert doc from mongo', async () => {
      expect.assertions(2)
      const docs = [getDoc(1), getDoc(2)]
      jest.spyOn(adapter, 'mapDocsFromMongo')

      await adapter.insertMany(docs)
      expect(adapter.mapDocsFromMongo).toHaveBeenCalledTimes(1)
      expect(adapter.mapDocsFromMongo).toHaveBeenCalledWith([
        docToMongo(getDocWithId(1, 1)),
        docToMongo(getDocWithId(2, 2))
      ])
    })
  })

  describe('#updateById', () => {
    it('should call collection#findOneAndUpdate', async () => {
      expect.assertions(2)
      const id = mongodb.ObjectID()
      const update = {}
      const options = {}
      await adapter.updateById(id, update, options)
      expect(adapter.collection.findOneAndUpdate).toHaveBeenCalledTimes(1)
      expect(adapter.collection.findOneAndUpdate).toHaveBeenCalledWith({
        _id: id
      }, update, Object.assign({
        returnOriginal: false
      }, options))
    })

    it('should return updated doc', async () => {
      expect.assertions(1)
      const id = 1
      const update = {}
      const updatedDoc = await adapter.updateById(id, update)
      expect(updatedDoc).toEqual(getDocWithId())
    })

    it('should return false id doc is not inserted', async () => {
      expect.assertions(1)
      const id = 1
      const update = {}
      adapter.collection.findOneAndUpdate = jest.fn(() => ({ value: null }))
      const updatedDoc = await adapter.updateById(id, update)
      expect(updatedDoc).toBe(false)
    })

    it('should convert doc from mongo', async () => {
      expect.assertions(2)
      const id = 1
      const update = {}
      jest.spyOn(adapter, 'mapDocFromMongo')

      await adapter.updateById(id, update)
      expect(adapter.mapDocFromMongo).toHaveBeenCalledTimes(1)
      expect(adapter.mapDocFromMongo).toHaveBeenCalledWith(docToMongo(getDocWithId()))
    })
  })

  describe('#updateMany', () => {
    it('should call collection#updateMany', async () => {
      expect.assertions(2)
      const filter = {}
      const update = {}
      const options = {}
      await adapter.updateMany(filter, update, options)
      expect(adapter.collection.updateMany).toHaveBeenCalledTimes(1)
      expect(adapter.collection.updateMany).toHaveBeenCalledWith(filter, update, options)
    })

    it('should return updated count', async () => {
      expect.assertions(1)
      const filter = {}
      const update = {}
      const updatedCount = await adapter.updateMany(filter, update)
      expect(updatedCount).toEqual(1)
    })
  })

  describe('#deleteById', () => {
    it('should call collection#findOneAndDelete', async () => {
      expect.assertions(2)
      const id = mongodb.ObjectID()
      const options = {}
      await adapter.deleteById(id, options)
      expect(adapter.collection.findOneAndDelete).toHaveBeenCalledTimes(1)
      expect(adapter.collection.findOneAndDelete).toHaveBeenCalledWith({
        _id: id
      }, options)
    })

    it('should return deleted doc id', async () => {
      expect.assertions(1)
      const id = 1
      const deletedId = await adapter.deleteById(id)
      expect(deletedId).toEqual('1')
    })

    it('should return false id doc is not deleted or does not exist', async () => {
      expect.assertions(1)
      const id = 1
      adapter.collection.findOneAndDelete = jest.fn(() => ({ value: null }))
      const deletedId = await adapter.deleteById(id)
      expect(deletedId).toBe(false)
    })
  })

  describe('#deleteByIds', () => {
    it('should call deleteById', async () => {
      expect.assertions(3)
      const ids = [mongodb.ObjectID(), mongodb.ObjectID()]
      const options = {}
      jest.spyOn(adapter, 'deleteById')
      await adapter.deleteByIds(ids, options)

      expect(adapter.deleteById).toHaveBeenCalledTimes(2)
      expect(adapter.deleteById).toHaveBeenCalledWith(ids[0], options)
      expect(adapter.deleteById).toHaveBeenCalledWith(ids[1], options)
    })

    it('should return deleted doc ids', async () => {
      expect.assertions(2)
      const ids = [mongodb.ObjectID(), mongodb.ObjectID()]
      adapter.deleteById = jest.fn()
        .mockReturnValueOnce(ids[0])
        .mockReturnValueOnce(ids[1])
      const deletedIds1 = await adapter.deleteByIds(ids)
      expect(deletedIds1.length).toEqual(2)

      // only one deleted
      adapter.deleteById = jest.fn()
        .mockReturnValueOnce(ids[0])
        .mockReturnValueOnce(false)
      const deletedIds2 = await adapter.deleteByIds(ids)
      expect(deletedIds2.length).toEqual(1)
    })
  })

  describe('#deleteMany', () => {
    it('should call collection#deleteMany', async () => {
      expect.assertions(2)
      const filter = {}
      const options = {}
      await adapter.deleteMany(filter, options)
      expect(adapter.collection.deleteMany).toHaveBeenCalledTimes(1)
      expect(adapter.collection.deleteMany).toHaveBeenCalledWith(filter, options)
    })

    it('should return deleted count', async () => {
      expect.assertions(1)
      const filter = {}
      const deletedCount = await adapter.updateMany(filter)
      expect(deletedCount).toEqual(1)
    })
  })

  describe('#findById', () => {
    it('should call collection#findOne', async () => {
      expect.assertions(2)
      const id = mongodb.ObjectID()
      const options = {}
      await adapter.findById(id, options)
      expect(adapter.collection.findOne).toHaveBeenCalledTimes(1)
      expect(adapter.collection.findOne).toHaveBeenCalledWith({
        _id: id
      }, options)
    })

    it('should return doc', async () => {
      expect.assertions(1)
      const id = 1
      const found = await adapter.findById(id)
      expect(found).toEqual(getDocWithId())
    })

    it('should convert doc from mongo', async () => {
      expect.assertions(2)
      const id = 1
      jest.spyOn(adapter, 'mapDocFromMongo')

      await adapter.findById(id)
      expect(adapter.mapDocFromMongo).toHaveBeenCalledTimes(1)
      expect(adapter.mapDocFromMongo).toHaveBeenCalledWith(docToMongo(getDocWithId()))
    })
  })

  describe('#findByIds', () => {
    it('should call find', async () => {
      expect.assertions(2)
      const ids = [mongodb.ObjectID(), mongodb.ObjectID()]
      const options = {}
      jest.spyOn(adapter, 'find')
      await adapter.findByIds(ids, options)

      expect(adapter.find).toHaveBeenCalledTimes(1)
      expect(adapter.find).toHaveBeenCalledWith({
        _id: {
          $in: ids
        }
      }, options)
    })
  })

  describe('#findOne', () => {
    it('should call find', async () => {
      expect.assertions(2)
      const filter = { name: 'name-1' }
      const options = {}
      jest.spyOn(adapter, 'find')
      await adapter.findOne(filter, options)
      expect(adapter.find).toHaveBeenCalledTimes(1)
      expect(adapter.find).toHaveBeenCalledWith({
        ...filter,
        $limit: 1
      }, options)
    })
  })

  describe('#find', () => {
    it('should call createCursor', async () => {
      expect.assertions(2)
      const filter = { name: 'name-1' }
      const options = {}
      jest.spyOn(adapter, 'createCursor')
      await adapter.find(filter, options)
      expect(adapter.createCursor).toHaveBeenCalledTimes(1)
      expect(adapter.createCursor).toHaveBeenCalledWith(filter, options)
    })
  })

  describe('#count', () => {
    it('should call collection#count', async () => {
      expect.assertions(2)
      const filter = { name: 'name-1' }
      const options = {}
      await adapter.count(filter, options)
      expect(adapter.collection.count).toHaveBeenCalledTimes(1)
      expect(adapter.collection.count).toHaveBeenCalledWith(filter, options)
    })

    it('should return count', async () => {
      expect.assertions(1)
      const filter = { name: 'name-1' }
      const count = await adapter.count(filter)
      expect(count).toEqual(1)
    })
  })

  describe('#createCursor', () => {
    const filter = {
      name: 'name-1',
      $select: 'name,state',
      $offset: 100,
      $limit: 10,
      $sort: '-name,+state,suburb'
    }

    it('should call collection#find', async () => {
      expect.assertions(2)
      const options = {}
      await adapter.createCursor(filter, options)
      expect(adapter.collection.find).toHaveBeenCalledTimes(1)
      expect(adapter.collection.find).toHaveBeenCalledWith({
        name: 'name-1'
      }, options)
    })

    it('should project fields if $select is present in filter', async () => {
      expect.assertions(2)
      const cursor = adapter.createCursor(filter)
      expect(cursor.project).toHaveBeenCalledTimes(1)
      expect(cursor.project).toHaveBeenCalledWith({ name: 1, state: 1 })
    })

    it('should sort by fields if $sort is present in filter', async () => {
      expect.assertions(2)
      const cursor = adapter.createCursor(filter)
      expect(cursor.sort).toHaveBeenCalledTimes(1)
      expect(cursor.sort).toHaveBeenCalledWith({ name: -1, state: 1, suburb: 1 })
    })

    it('should limit if $limit is present in filter', async () => {
      expect.assertions(2)
      const cursor = adapter.createCursor(filter)
      expect(cursor.limit).toHaveBeenCalledTimes(1)
      expect(cursor.limit).toHaveBeenCalledWith(10)
    })

    it('should start from offset if $offset is present in filter', async () => {
      expect.assertions(2)
      const cursor = adapter.createCursor(filter)
      expect(cursor.skip).toHaveBeenCalledTimes(1)
      expect(cursor.skip).toHaveBeenCalledWith(100)
    })
  })
})
