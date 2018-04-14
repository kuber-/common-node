import Datastore from '@google-cloud/datastore'
import GoogleDatastoreAdapter from '../GoogleDatastoreAdapter'

const defaultSchema = {
  name: 'user'
}

const defaultOptions = {
  kind: 'user',
  dsOtions: {}
}

// const mapIdToKey = (id) => {
//   if (Datastore.prototype.isKey(id)) {
//     return id
//   }

//   const path = id ? [this.kind, id] : [this.kind, uuid.v4()]
//   return this.datastore.key(path)
// }

const getDoc = (counter = 1) => ({
  name: `name-${counter}`
})

const getDocWithId = (id = 1, counter = 1) => ({
  id: `${id}`,
  ...getDoc(counter)
})

const docToDatastore = (doc) => {
  const { id, ...data } = doc
  return {
    key: Datastore.prototype.key(['user', id]),
    data: data
  }
}

const datastore = () => ({
  key: Datastore.prototype.key,
  isKey: Datastore.prototype.isKey,
  insert: jest.fn((doc) => ({
    ...docToDatastore(getDocWithId())
  })),

  insertMany: jest.fn(() => ({
    insertedCount: 2,
    ops: [
      docToDatastore(getDocWithId(1, 1)),
      docToDatastore(getDocWithId(2, 2))
    ]
  })),

  findOneAndUpdate: jest.fn(() => ({
    value: docToDatastore(getDocWithId())
  })),

  updateMany: jest.fn(() => ({
    modifiedCount: 1
  })),

  findOneAndDelete: jest.fn(() => ({
    value: docToDatastore(getDocWithId())
  })),

  deleteMany: jest.fn(() => ({
    deletedCount: 1
  })),

  findOne: jest.fn(() => docToDatastore(getDocWithId())),

  find: jest.fn(() => ({
    project: jest.fn(),
    limit: jest.fn(),
    skip: jest.fn(),
    sort: jest.fn(),
    toArray: jest.fn(() => [
      docToDatastore(getDocWithId(1, 1)),
      docToDatastore(getDocWithId(2, 2))
    ])
  })),

  count: jest.fn(() => 1)
})

describe('GoogleDatastoreAdapter', () => {
  let adapter = null

  beforeEach(() => {
    adapter = new GoogleDatastoreAdapter(defaultOptions)
    adapter.init({ schema: defaultSchema })
    adapter.datastore = datastore()
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
    expect(adapter.mapIdToKey).toBeDefined()
    expect(adapter.mapKeyToId).toBeDefined()
    expect(adapter.toArray).toBeDefined()
    expect(adapter.mapDocFromDatastore).toBeDefined()
    expect(adapter.mapDocsFromDatastore).toBeDefined()
    expect(adapter.mapDocToDatastore).toBeDefined()
    expect(adapter.mapDocsToDatastore).toBeDefined()
  })

  describe('#init', () => {
    it('should populate instance values', () => {
      expect(adapter.schema).toBe(defaultSchema)
      expect(adapter.kind).toBe(defaultOptions.kind)
      expect(adapter.datastore).toBeDefined()
    })
  })

  describe('privateMethods', () => {
    describe('#mapIdToKey', () => {
      it('should map id to datastore key', () => {
        const id = 1
        const key = adapter.mapIdToKey(id)
        expect(Datastore.prototype.isKey(key)).toBeTruthy()
        expect(key.id).toBe(id)
      })

      it('should return id if id is key', () => {
        const id = Datastore.prototype.key(['user', 1])
        const key = adapter.mapIdToKey(id)
        expect(id).toBe(key)
      })

      it('should generate a new key with uuid if id is not given', () => {
        adapter.generateId = jest.fn().mockReturnValueOnce(1).mockReturnValueOnce('1')
        const key1 = adapter.mapIdToKey()
        const key2 = adapter.mapIdToKey()
        expect(Datastore.prototype.isKey(key1)).toBeTruthy()
        expect(key1.id).toBe(1)
        expect(key1.kind).toBe('user')
        expect(Datastore.prototype.isKey(key2)).toBeTruthy()
        expect(key2.name).toBe('1')
        expect(key2.kind).toBe('user')
      })
    })

    describe('#mapKeyToId', () => {
      it('should return id from key', () => {
        adapter.generateId = jest.fn().mockReturnValueOnce(1).mockReturnValueOnce('1')
        const key1 = adapter.mapIdToKey()
        const key2 = adapter.mapIdToKey()
        const id1 = adapter.mapKeyToId(key1)
        const id2 = adapter.mapKeyToId(key2)
        expect(id1).toBe(1)
        expect(id2).toBe('1')
      })

      it('should return id if given key is id', () => {
        const id1 = adapter.mapKeyToId(1)
        const id2 = adapter.mapKeyToId('1')
        expect(id1).toBe(1)
        expect(id2).toBe('1')
      })
    })

    describe('#mapDocToDatastore', () => {
      it('should map doc to datastore doc', () => {
        const doc = getDoc()
        const datastoreDoc = adapter.mapDocToDatastore(doc)
        expect(datastoreDoc.data).toEqual(doc)
        expect(Datastore.prototype.isKey(datastoreDoc.key)).toBeTruthy()
      })

      it('should return doc if doc is datastore doc', () => {
        const doc = docToDatastore(getDocWithId(1))
        const datastoreDoc = adapter.mapDocToDatastore(doc)
        expect(datastoreDoc).toBe(doc)
      })
    })

    describe('#mapDocFromDatastore', () => {
      it('should return doc from datastoreDoc', () => {
        const doc = getDocWithId(1)
        const datastoreDoc = docToDatastore(doc)
        const returnDoc = adapter.mapDocFromDatastore(datastoreDoc)
        expect(returnDoc).toEqual(doc)
      })
    })
  })

  describe('#insertOne', () => {
    // beforeEach(() => {
    //   adapter.datastrore.insertOne = jest.fn((doc) => ({
    //     key: doc.key,
    //     data: doc.data
    //   }))
    // })

    it('should call datastore#insert', async () => {
      expect.assertions(2)
      const doc = getDocWithId()
      await adapter.insertOne(doc)
      expect(adapter.datastore.insert).toHaveBeenCalledTimes(1)
      expect(adapter.datastore.insert).toHaveBeenCalledWith(docToDatastore(doc))
    })

    it('should return inserted doc', async () => {
      expect.assertions(1)
      const doc = getDocWithId()
      const insertedDoc = await adapter.insertOne(doc)
      expect(insertedDoc).toEqual(getDocWithId())
    })

    // it('should return false id doc is not inserted', async () => {
    //   expect.assertions(1)
    //   const doc = getDoc()
    //   adapter.collection.insertOne = jest.fn(() => ({ insertedCount: 0 }))
    //   const insertedDoc = await adapter.insertOne(doc)
    //   expect(insertedDoc).toBe(false)
    // })

    // it('should convert doc to mongo', async () => {
    //   expect.assertions(2)
    //   const doc = getDoc()
    //   jest.spyOn(adapter, 'mapdocToDatastore')

    //   await adapter.insertOne(doc)
    //   expect(adapter.mapdocToDatastore).toHaveBeenCalledTimes(1)
    //   expect(adapter.mapdocToDatastore).toHaveBeenCalledWith(doc)
    // })

    // it('should convert doc from mongo', async () => {
    //   expect.assertions(2)
    //   const doc = getDoc()
    //   jest.spyOn(adapter, 'mapDocFromMongo')

    //   await adapter.insertOne(doc)
    //   expect(adapter.mapDocFromMongo).toHaveBeenCalledTimes(1)
    //   expect(adapter.mapDocFromMongo).toHaveBeenCalledWith(docToDatastore(getDocWithId()))
    // })
  })

  // describe('#insertMany', () => {
  //   it('should call collection#insertMany', async () => {
  //     expect.assertions(2)
  //     const docs = [getDoc(1), getDoc(2)]
  //     const options = {}
  //     await adapter.insertMany(docs, options)
  //     expect(adapter.collection.insertMany).toHaveBeenCalledTimes(1)
  //     expect(adapter.collection.insertMany).toHaveBeenCalledWith(docs.map(docToDatastore), options)
  //   })

  //   it('should return inserted docs', async () => {
  //     expect.assertions(1)
  //     const docs = [getDoc(1), getDoc(2)]
  //     const insertedDocs = await adapter.insertMany(docs)
  //     expect(insertedDocs).toEqual([
  //       getDocWithId(1, 1),
  //       getDocWithId(2, 2)
  //     ])
  //   })

  //   it('should return false id docs are not inserted', async () => {
  //     expect.assertions(1)
  //     const docs = [getDoc(1), getDoc(2)]
  //     adapter.collection.insertMany = jest.fn(() => ({ insertedCount: 0 }))
  //     const insertedDocs = await adapter.insertMany(docs)
  //     expect(insertedDocs).toBe(false)
  //   })

  //   it('should convert docs to mongo', async () => {
  //     expect.assertions(2)
  //     const docs = [getDoc(1), getDoc(2)]
  //     jest.spyOn(adapter, 'mapDocsToMongo')

  //     await adapter.insertMany(docs)
  //     expect(adapter.mapDocsToMongo).toHaveBeenCalledTimes(1)
  //     expect(adapter.mapDocsToMongo).toHaveBeenCalledWith(docs)
  //   })

  //   it('should convert doc from mongo', async () => {
  //     expect.assertions(2)
  //     const docs = [getDoc(1), getDoc(2)]
  //     jest.spyOn(adapter, 'mapDocsFromMongo')

  //     await adapter.insertMany(docs)
  //     expect(adapter.mapDocsFromMongo).toHaveBeenCalledTimes(1)
  //     expect(adapter.mapDocsFromMongo).toHaveBeenCalledWith([
  //       docToDatastore(getDocWithId(1, 1)),
  //       docToDatastore(getDocWithId(2, 2))
  //     ])
  //   })
  // })

  // describe('#updateById', () => {
  //   it('should call collection#findOneAndUpdate', async () => {
  //     expect.assertions(2)
  //     const id = mongodb.ObjectID()
  //     const update = {}
  //     const options = {}
  //     await adapter.updateById(id, update, options)
  //     expect(adapter.collection.findOneAndUpdate).toHaveBeenCalledTimes(1)
  //     expect(adapter.collection.findOneAndUpdate).toHaveBeenCalledWith({
  //       _id: id
  //     }, update, Object.assign({
  //       returnOriginal: false
  //     }, options))
  //   })

  //   it('should return updated doc', async () => {
  //     expect.assertions(1)
  //     const id = 1
  //     const update = {}
  //     const updatedDoc = await adapter.updateById(id, update)
  //     expect(updatedDoc).toEqual(getDocWithId())
  //   })

  //   it('should return false id doc is not inserted', async () => {
  //     expect.assertions(1)
  //     const id = 1
  //     const update = {}
  //     adapter.collection.findOneAndUpdate = jest.fn(() => ({ value: null }))
  //     const updatedDoc = await adapter.updateById(id, update)
  //     expect(updatedDoc).toBe(false)
  //   })

  //   it('should convert doc from mongo', async () => {
  //     expect.assertions(2)
  //     const id = 1
  //     const update = {}
  //     jest.spyOn(adapter, 'mapDocFromMongo')

  //     await adapter.updateById(id, update)
  //     expect(adapter.mapDocFromMongo).toHaveBeenCalledTimes(1)
  //     expect(adapter.mapDocFromMongo).toHaveBeenCalledWith(docToDatastore(getDocWithId()))
  //   })
  // })

  // describe('#updateMany', () => {
  //   it('should call collection#updateMany', async () => {
  //     expect.assertions(2)
  //     const filter = {}
  //     const update = {}
  //     const options = {}
  //     await adapter.updateMany(filter, update, options)
  //     expect(adapter.collection.updateMany).toHaveBeenCalledTimes(1)
  //     expect(adapter.collection.updateMany).toHaveBeenCalledWith(filter, update, options)
  //   })

  //   it('should return updated count', async () => {
  //     expect.assertions(1)
  //     const filter = {}
  //     const update = {}
  //     const updatedCount = await adapter.updateMany(filter, update)
  //     expect(updatedCount).toEqual(1)
  //   })
  // })

  // describe('#deleteById', () => {
  //   it('should call collection#findOneAndDelete', async () => {
  //     expect.assertions(2)
  //     const id = mongodb.ObjectID()
  //     const options = {}
  //     await adapter.deleteById(id, options)
  //     expect(adapter.collection.findOneAndDelete).toHaveBeenCalledTimes(1)
  //     expect(adapter.collection.findOneAndDelete).toHaveBeenCalledWith({
  //       _id: id
  //     }, options)
  //   })

  //   it('should return deleted doc id', async () => {
  //     expect.assertions(1)
  //     const id = 1
  //     const deletedId = await adapter.deleteById(id)
  //     expect(deletedId).toEqual('1')
  //   })

  //   it('should return false id doc is not deleted or does not exist', async () => {
  //     expect.assertions(1)
  //     const id = 1
  //     adapter.collection.findOneAndDelete = jest.fn(() => ({ value: null }))
  //     const deletedId = await adapter.deleteById(id)
  //     expect(deletedId).toBe(false)
  //   })
  // })

  // describe('#deleteByIds', () => {
  //   it('should call deleteById', async () => {
  //     expect.assertions(3)
  //     const ids = [mongodb.ObjectID(), mongodb.ObjectID()]
  //     const options = {}
  //     jest.spyOn(adapter, 'deleteById')
  //     await adapter.deleteByIds(ids, options)

  //     expect(adapter.deleteById).toHaveBeenCalledTimes(2)
  //     expect(adapter.deleteById).toHaveBeenCalledWith(ids[0], options)
  //     expect(adapter.deleteById).toHaveBeenCalledWith(ids[1], options)
  //   })

  //   it('should return deleted doc ids', async () => {
  //     expect.assertions(2)
  //     const ids = [mongodb.ObjectID(), mongodb.ObjectID()]
  //     adapter.deleteById = jest.fn()
  //       .mockReturnValueOnce(ids[0])
  //       .mockReturnValueOnce(ids[1])
  //     const deletedIds1 = await adapter.deleteByIds(ids)
  //     expect(deletedIds1.length).toEqual(2)

  //     // only one deleted
  //     adapter.deleteById = jest.fn()
  //       .mockReturnValueOnce(ids[0])
  //       .mockReturnValueOnce(false)
  //     const deletedIds2 = await adapter.deleteByIds(ids)
  //     expect(deletedIds2.length).toEqual(1)
  //   })
  // })

  // describe('#deleteMany', () => {
  //   it('should call collection#deleteMany', async () => {
  //     expect.assertions(2)
  //     const filter = {}
  //     const options = {}
  //     await adapter.deleteMany(filter, options)
  //     expect(adapter.collection.deleteMany).toHaveBeenCalledTimes(1)
  //     expect(adapter.collection.deleteMany).toHaveBeenCalledWith(filter, options)
  //   })

  //   it('should return deleted count', async () => {
  //     expect.assertions(1)
  //     const filter = {}
  //     const deletedCount = await adapter.updateMany(filter)
  //     expect(deletedCount).toEqual(1)
  //   })
  // })

  // describe('#findById', () => {
  //   it('should call collection#findOne', async () => {
  //     expect.assertions(2)
  //     const id = mongodb.ObjectID()
  //     const options = {}
  //     await adapter.findById(id, options)
  //     expect(adapter.collection.findOne).toHaveBeenCalledTimes(1)
  //     expect(adapter.collection.findOne).toHaveBeenCalledWith({
  //       _id: id
  //     }, options)
  //   })

  //   it('should return doc', async () => {
  //     expect.assertions(1)
  //     const id = 1
  //     const found = await adapter.findById(id)
  //     expect(found).toEqual(getDocWithId())
  //   })

  //   it('should convert doc from mongo', async () => {
  //     expect.assertions(2)
  //     const id = 1
  //     jest.spyOn(adapter, 'mapDocFromMongo')

  //     await adapter.findById(id)
  //     expect(adapter.mapDocFromMongo).toHaveBeenCalledTimes(1)
  //     expect(adapter.mapDocFromMongo).toHaveBeenCalledWith(docToDatastore(getDocWithId()))
  //   })
  // })

  // describe('#findByIds', () => {
  //   it('should call find', async () => {
  //     expect.assertions(2)
  //     const ids = [mongodb.ObjectID(), mongodb.ObjectID()]
  //     const options = {}
  //     jest.spyOn(adapter, 'find')
  //     await adapter.findByIds(ids, options)

  //     expect(adapter.find).toHaveBeenCalledTimes(1)
  //     expect(adapter.find).toHaveBeenCalledWith({
  //       _id: {
  //         $in: ids
  //       }
  //     }, options)
  //   })
  // })

  // describe('#findOne', () => {
  //   it('should call find', async () => {
  //     expect.assertions(2)
  //     const filter = { name: 'name-1' }
  //     const options = {}
  //     jest.spyOn(adapter, 'find')
  //     await adapter.findOne(filter, options)
  //     expect(adapter.find).toHaveBeenCalledTimes(1)
  //     expect(adapter.find).toHaveBeenCalledWith({
  //       ...filter,
  //       $limit: 1
  //     }, options)
  //   })
  // })

  // describe('#find', () => {
  //   it('should call createCursor', async () => {
  //     expect.assertions(2)
  //     const filter = { name: 'name-1' }
  //     const options = {}
  //     jest.spyOn(adapter, 'createCursor')
  //     await adapter.find(filter, options)
  //     expect(adapter.createCursor).toHaveBeenCalledTimes(1)
  //     expect(adapter.createCursor).toHaveBeenCalledWith(filter, options)
  //   })
  // })

  // describe('#count', () => {
  //   it('should call collection#count', async () => {
  //     expect.assertions(2)
  //     const filter = { name: 'name-1' }
  //     const options = {}
  //     await adapter.count(filter, options)
  //     expect(adapter.collection.count).toHaveBeenCalledTimes(1)
  //     expect(adapter.collection.count).toHaveBeenCalledWith(filter, options)
  //   })

  //   it('should return count', async () => {
  //     expect.assertions(1)
  //     const filter = { name: 'name-1' }
  //     const count = await adapter.count(filter)
  //     expect(count).toEqual(1)
  //   })
  // })

  // describe('#createCursor', () => {
  //   const filter = {
  //     name: 'name-1',
  //     $select: 'name,state',
  //     $offset: 100,
  //     $limit: 10,
  //     $sort: '-name,+state,suburb'
  //   }

  //   it('should call collection#find', async () => {
  //     expect.assertions(2)
  //     const options = {}
  //     await adapter.createCursor(filter, options)
  //     expect(adapter.collection.find).toHaveBeenCalledTimes(1)
  //     expect(adapter.collection.find).toHaveBeenCalledWith({
  //       name: 'name-1'
  //     }, options)
  //   })

  //   it('should project fields if $select is present in filter', async () => {
  //     expect.assertions(2)
  //     const cursor = adapter.createCursor(filter)
  //     expect(cursor.project).toHaveBeenCalledTimes(1)
  //     expect(cursor.project).toHaveBeenCalledWith({ name: 1, state: 1 })
  //   })

  //   it('should sort by fields if $sort is present in filter', async () => {
  //     expect.assertions(2)
  //     const cursor = adapter.createCursor(filter)
  //     expect(cursor.sort).toHaveBeenCalledTimes(1)
  //     expect(cursor.sort).toHaveBeenCalledWith({ name: -1, state: 1, suburb: 1 })
  //   })

  //   it('should limit if $limit is present in filter', async () => {
  //     expect.assertions(2)
  //     const cursor = adapter.createCursor(filter)
  //     expect(cursor.limit).toHaveBeenCalledTimes(1)
  //     expect(cursor.limit).toHaveBeenCalledWith(10)
  //   })

  //   it('should start from offset if $offset is present in filter', async () => {
  //     expect.assertions(2)
  //     const cursor = adapter.createCursor(filter)
  //     expect(cursor.skip).toHaveBeenCalledTimes(1)
  //     expect(cursor.skip).toHaveBeenCalledWith(100)
  //   })
  // })
})
