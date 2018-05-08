import Datastore from '../Datastore'
import Schema from '../Schema'

const getEntity = (counter = 1) => ({
  name: `name-${counter}`,
  state: `state-${counter}`,
  suburb: `suburb-${counter}`
})

const getEntityWithId = (id = 1, counter = 1) => ({
  id,
  ...getEntity(counter)
})

const defaultAdapter = () => ({
  init: jest.fn(),
  insertOne: jest.fn(() => getEntityWithId()),
  insertMany: jest.fn(() => [getEntityWithId(1, 1), getEntityWithId(2, 2)]),
  updateById: jest.fn(() => getEntityWithId()),
  updateMany: jest.fn(() => 1),
  deleteById: jest.fn(() => 1),
  deleteByIds: jest.fn(() => [1, 2]),
  deleteMany: jest.fn(() => 1),
  findById: jest.fn(() => getEntityWithId()),
  findByIds: jest.fn(() => [getEntityWithId(1, 1), getEntityWithId(2, 2)]),
  findOne: jest.fn(() => getEntityWithId()),
  find: jest.fn(() => [getEntityWithId(1, 1), getEntityWithId(2, 2)]),
  count: jest.fn(() => 1)
})

const transactionAwareAdatper = () => ({
  init: jest.fn(),
  transaction: jest.fn()
})

const defaultSchemaName = 'defaultSchema'
const defaultSchema = () => new Schema({
  name: defaultSchemaName,
  entity: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      state: { type: 'string' },
      suburb: { type: 'string' }
    }
  }
})

describe('Datastore', () => {
  let datastore = null

  beforeEach(() => {
    datastore = new Datastore({
      adapter: defaultAdapter(),
      schema: defaultSchema()
    })

    jest.spyOn(datastore, 'notify')
    jest.spyOn(datastore.schema, 'validate')
  })

  it('should have interface methods', () => {
    expect(datastore.adapter).toBeDefined()
    expect(datastore.schema).toBeDefined()
    expect(datastore.insertOne).toBeDefined()
    expect(datastore.insertMany).toBeDefined()
    expect(datastore.updateById).toBeDefined()
    expect(datastore.deleteById).toBeDefined()
    expect(datastore.deleteByIds).toBeDefined()
    expect(datastore.findById).toBeDefined()
    expect(datastore.findByIds).toBeDefined()
    expect(datastore.findOne).toBeDefined()
    expect(datastore.find).toBeDefined()
    expect(datastore.count).toBeDefined()
    expect(datastore.transaction).toBeDefined()
    expect(datastore.raw).toBeDefined()
  })

  it('should have private methods', () => {
    expect(datastore.getAdapter).toBeDefined()
    expect(datastore.notify).toBeDefined()
    expect(datastore.convertUpdate).toBeDefined()
    expect(datastore.invokeAdapterMethod).toBeDefined()
  })

  describe('#invokeAdapterMethod', async () => {
    it('should throw if method does not exist on adapter', async () => {
      expect.assertions(1)
      return expect(datastore.invokeAdapterMethod('non-existent-method')).rejects.toMatchObject({
        message: 'Adapter provided did not implement non-existent-method'
      })
    })
  })

  describe('#convertUpdate', () => {
    it('should convert update values to datatastore internal update format', () => {
      const tests = [{
        given: { name: 'name', state: 'state' },
        expected: {
          update: { $set: { name: 'name', state: 'state' } },
          validate: { name: 'name', state: 'state' }
        }
      }, {
        given: { name: 'name', state: 'state', $set: { suburb: 'suburb' } },
        expected: {
          update: { $set: { name: 'name', state: 'state', suburb: 'suburb' } },
          validate: { name: 'name', state: 'state', suburb: 'suburb' }
        }
      }, {
        given: { name: 'name', state: 'state', $inc: { total: 10 } },
        expected: {
          update: { $set: { name: 'name', state: 'state' }, $inc: { total: 10 } },
          validate: { name: 'name', state: 'state', total: 10 }
        }
      }, {
        given: { name: 'name', state: 'state', $set: { suburb: 'suburb' }, $inc: { total: 10 } },
        expected: {
          update: { $set: { name: 'name', state: 'state', suburb: 'suburb' }, $inc: { total: 10 } },
          validate: { name: 'name', state: 'state', suburb: 'suburb', total: 10 }
        }
      }, {
        given: { 'name.first': 'first name', $set: { 'name.last': 'last name' }, $inc: { 'views.total': 10 } },
        expected: {
          update: { $set: { 'name.first': 'first name', 'name.last': 'last name' }, $inc: { 'views.total': 10 } },
          validate: { name: { first: 'first name', last: 'last name' }, views: { total: 10 } }
        }
      }]

      tests.forEach((value) => {
        expect(datastore.convertUpdate(value.given)).toEqual(value.expected)
      })
    })

    it('should throw error when nothing is given', () => {
      expect(() => datastore.convertUpdate()).toThrow('update is empty. You must specify at least one field')
    })

    it('should throw error when empty object is given', () => {
      expect(() => datastore.convertUpdate({})).toThrow('update is empty. You must specify at least one field')
    })
  })

  describe('#notify', () => {
    it('should emit eventName when given eventName and/or data', async () => {
      expect.assertions(2)
      datastore.emit = jest.fn()
      await datastore.notify('test event', {})
      expect(datastore.emit).toHaveBeenCalledTimes(2)
      expect(datastore.emit).toHaveBeenCalledWith('test event', {})
    })

    it('should emit * when given any event and/or data', async () => {
      expect.assertions(2)
      datastore.emit = jest.fn()
      await datastore.notify('test event', {})
      expect(datastore.emit).toHaveBeenCalledTimes(2)
      expect(datastore.emit).toHaveBeenCalledWith('*', 'test event', {})
    })
  })

  describe('#getAdapter', () => {
    it('should return adapter passed in config', async () => {
      expect.assertions(2)
      const adapter = await datastore.getAdapter()
      expect(adapter.__initialized).toBe(true)
      expect(adapter).toEqual(datastore.adapter)
    })

    it('should call adapter init only once with schema', async () => {
      expect.assertions(4)
      const adapter = await datastore.getAdapter()
      expect(adapter.init).toBeCalled()
      expect(adapter.init).toBeCalledWith({
        schema: datastore.schema
      })

      const adapterAgain = await datastore.getAdapter()
      expect(adapterAgain).toBe(adapter)
      expect(adapterAgain.init).toHaveBeenCalledTimes(1)
    })

    it('should work with adapter passed as function in config', async () => {
      expect.assertions(10)
      const adapter_ = defaultAdapter()
      const datastoreWithAdapterFunction = new Datastore({
        adapter: jest.fn(() => adapter_),
        schema: defaultSchema()
      })

      const options = {}
      const adapter = await datastoreWithAdapterFunction.getAdapter(options)
      expect(datastoreWithAdapterFunction.adapter).toHaveBeenCalledWith(options)
      expect(adapter).toBe(adapter_)
      expect(adapter.init).toHaveBeenCalledTimes(1)
      expect(adapter.init).toHaveBeenCalledTimes(1)

      const adapterAgain = await datastoreWithAdapterFunction.getAdapter(options)
      expect(datastoreWithAdapterFunction.adapter).toHaveBeenCalledWith(options)
      expect(adapterAgain).toBe(adapter_)
      expect(adapterAgain.init).toHaveBeenCalledTimes(1)
      expect(adapterAgain.init).toHaveBeenCalledTimes(1)

      expect(adapter_.init).toHaveBeenCalledTimes(1)
      expect(adapter_.init).toHaveBeenCalledTimes(1)
    })
  })

  describe('#insertOne', () => {
    it('should validate entity before insert', async () => {
      expect.assertions(1)
      const entity = getEntity()
      await datastore.insertOne(entity)
      expect(datastore.schema.validate).toHaveBeenCalledWith(entity)
    })

    it('should throw if entity is not valid before insert', async () => {
      expect.assertions(1)
      const invalidEntity = { name: 1 }
      return expect(datastore.insertOne(invalidEntity)).rejects.toMatchObject({
        message: 'Parameters validation error!',
        code: 422
      })
    })

    it('should call adapter#insertOne', async () => {
      expect.assertions(1)
      const entity = getEntity()
      const options = {}
      await datastore.insertOne(entity, options)
      expect(datastore.adapter.insertOne).toHaveBeenCalledWith(entity, options)
    })

    it('should return inserted entity', async () => {
      expect.assertions(1)
      const entity = getEntity()
      const insertedEntity = await datastore.insertOne(entity)
      expect(insertedEntity).toEqual(getEntityWithId())
    })

    it('should notify on successful insert', async () => {
      expect.assertions(1)
      const entity = getEntity()
      await datastore.insertOne(entity)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.created`, {
        entities: [getEntityWithId()]
      })
    })

    it('should not notify on unsuccessful insert', async () => {
      expect.assertions(1)
      const entity = getEntity()
      datastore.adapter.insertOne = jest.fn().mockReturnValue(false)
      await datastore.insertOne(entity)
      expect(datastore.notify).toHaveBeenCalledTimes(0)
    })

    it('should return false if on unsuccessful insert', async () => {
      expect.assertions(1)
      const entity = getEntity()
      datastore.adapter.insertOne = jest.fn().mockReturnValue(false)
      const returnValue = await datastore.insertOne(entity)
      expect(returnValue).toBe(false)
    })
  })

  describe('#insertMany', () => {
    it('should validate entities', async () => {
      expect.assertions(1)
      const entities = [getEntity(1), getEntity(2)]
      await datastore.insertMany(entities)
      expect(datastore.schema.validate).toHaveBeenCalledTimes(2)
    })

    it('should throw if entity is not valid', async () => {
      expect.assertions(1)
      const entities = [getEntity(1), { name: 1 }]
      return expect(datastore.insertMany(entities)).rejects.toMatchObject({
        message: 'Parameters validation error!',
        code: 422
      })
    })

    it('should call adapter#insertMany', async () => {
      expect.assertions(1)
      const entities = [getEntity(1), getEntity(2)]
      const options = {}
      await datastore.insertMany(entities, options)
      expect(datastore.adapter.insertMany).toHaveBeenCalledWith(entities, options)
    })

    it('should return inserted entities', async () => {
      expect.assertions(1)
      const entities = [getEntity(1), getEntity(2)]
      const insertedEntities = await datastore.insertMany(entities)
      expect(insertedEntities).toEqual([
        getEntityWithId(1, 1),
        getEntityWithId(2, 2)
      ])
    })

    it('should notify on successful insert', async () => {
      expect.assertions(1)
      const entities = [getEntity(1), getEntity(2)]
      await datastore.insertMany(entities)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.created`, {
        entities: [
          getEntityWithId(1, 1),
          getEntityWithId(2, 2)
        ]
      })
    })

    it('should not notify on unsuccessful insert', async () => {
      expect.assertions(1)
      const entities = [getEntity(1), getEntity(2)]
      datastore.adapter.insertMany = jest.fn().mockReturnValue(false)
      await datastore.insertMany(entities)
      expect(datastore.notify).toHaveBeenCalledTimes(0)
    })

    it('should return false if on unsuccessful insert', async () => {
      expect.assertions(1)
      const entities = [getEntity(1), getEntity(2)]
      datastore.adapter.insertMany = jest.fn().mockReturnValue(false)
      const returnValue = await datastore.insertMany(entities)
      expect(returnValue).toBe(false)
    })
  })

  describe('#updateById', () => {
    it('should convert given update', async () => {
      expect.assertions(2)
      const id = 1
      const update = { name: 'name-1' }
      jest.spyOn(datastore, 'convertUpdate')
      await datastore.updateById(id, update)
      expect(datastore.convertUpdate).toHaveBeenCalledTimes(1)
      expect(datastore.convertUpdate).toHaveBeenCalledWith(update)
    })

    it('should validate update', async () => {
      expect.assertions(2)
      const id = 1
      const update = { name: 'name-1' }
      const convertedUpdate = datastore.convertUpdate(update)
      await datastore.updateById(id, update)
      expect(datastore.schema.validate).toHaveBeenCalledTimes(1)
      expect(datastore.schema.validate).toHaveBeenCalledWith(convertedUpdate.validate, true)
    })

    it('should call adapter#updateById', async () => {
      expect.assertions(1)
      const id = 1
      const update = { name: 'name-1' }
      const convertedUpdate = datastore.convertUpdate(update)
      const options = {}
      await datastore.updateById(id, update, options)
      expect(datastore.adapter.updateById).toHaveBeenCalledWith(id, convertedUpdate.update, options)
    })

    it('should return updated entity', async () => {
      expect.assertions(1)
      const id = 1
      const update = { name: 'name-1' }
      const updatedEntity = await datastore.updateById(id, update)
      expect(updatedEntity).toEqual(getEntityWithId())
    })

    it('should notify on successful update', async () => {
      expect.assertions(1)
      const id = 1
      const update = { name: 'name-1' }
      await datastore.updateById(id, update)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.updated`, {
        entities: [getEntityWithId()]
      })
    })

    it('should not notify on unsuccessful update', async () => {
      expect.assertions(1)
      const id = 1
      const update = { name: 'name-1' }
      datastore.adapter.updateById = jest.fn().mockReturnValue(false)
      await datastore.updateById(id, update)
      expect(datastore.notify).toHaveBeenCalledTimes(0)
    })

    it('should return false if on unsuccessful update', async () => {
      expect.assertions(1)
      const id = 1
      const update = { name: 'name-1' }
      datastore.adapter.updateById = jest.fn().mockReturnValue(false)
      const returnValue = await datastore.updateById(id, update)
      expect(returnValue).toBe(false)
    })
  })

  describe('#deleteById', () => {
    it('should call adapter#deleteById', async () => {
      expect.assertions(1)
      const id = 1
      const options = {}
      await datastore.deleteById(id, options)
      expect(datastore.adapter.deleteById).toHaveBeenCalledWith(id, options)
    })

    it('should return deletedId', async () => {
      expect.assertions(1)
      const id = 1
      const deletedId = await datastore.deleteById(id)
      expect(deletedId).toBe(id)
    })

    it('should notify on successful delete', async () => {
      expect.assertions(1)
      const id = 1
      await datastore.deleteById(id)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.deleted`, {
        ids: [id]
      })
    })

    it('should return false if entity is not deleted or does not exist', async () => {
      expect.assertions(1)
      const id = 1
      datastore.adapter.deleteById = jest.fn(() => undefined)
      const deletedId = await datastore.deleteById(id)
      expect(deletedId).toBe(false)
    })

    it('should not notify if entity is not deleted or does not exist', async () => {
      expect.assertions(1)
      const id = 1
      datastore.adapter.deleteById = jest.fn(() => undefined)
      await datastore.deleteById(id)
      expect(datastore.notify).toHaveBeenCalledTimes(0)
    })

    it('should not notify on unsuccessful delete', async () => {
      expect.assertions(1)
      const id = 1
      datastore.adapter.deleteById = jest.fn().mockReturnValue(false)
      await datastore.deleteById(id)
      expect(datastore.notify).toHaveBeenCalledTimes(0)
    })

    it('should return false if on unsuccessful delete', async () => {
      expect.assertions(1)
      const id = 1
      datastore.adapter.deleteById = jest.fn().mockReturnValue(false)
      const returnValue = await datastore.deleteById(id)
      expect(returnValue).toBe(false)
    })
  })

  describe('#deleteByIds', () => {
    it('should call adapter#deleteByIds', async () => {
      expect.assertions(1)
      const ids = [1, 2]
      const options = {}
      await datastore.deleteByIds(ids, options)
      expect(datastore.adapter.deleteByIds).toHaveBeenCalledWith(ids, options)
    })

    it('should return deletedIds', async () => {
      expect.assertions(2)
      const ids = [1, 2]
      const deletedIds1 = await datastore.deleteByIds(ids)
      expect(deletedIds1).toEqual(ids)

      // only 1 deleted
      datastore.adapter.deleteByIds = jest.fn(() => [1])
      const deletedIds2 = await datastore.deleteByIds(ids)
      expect(deletedIds2).toEqual([1])
    })

    it('should notify on successful delete', async () => {
      expect.assertions(2)
      const ids = [1, 2]
      await datastore.deleteByIds(ids)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.deleted`, {
        ids
      })

      // only 1 deleted
      datastore.adapter.deleteByIds = jest.fn(() => [1])
      await datastore.deleteByIds(ids)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.deleted`, {
        ids: [1]
      })
    })

    it('should not notify if nothing is deleted', async () => {
      expect.assertions(1)
      const ids = [1, 2]
      datastore.adapter.deleteByIds = jest.fn(() => [])
      await datastore.deleteByIds(ids)
      expect(datastore.notify).toHaveBeenCalledTimes(0)
    })

    it('should not notify on unsuccessful delete', async () => {
      expect.assertions(1)
      const ids = [1, 2]
      datastore.adapter.deleteByIds = jest.fn().mockReturnValue(false)
      await datastore.deleteByIds(ids)
      expect(datastore.notify).toHaveBeenCalledTimes(0)
    })

    it('should return false if on unsuccessful delete', async () => {
      expect.assertions(1)
      const ids = [1, 2]
      datastore.adapter.deleteByIds = jest.fn().mockReturnValue(false)
      const returnValue = await datastore.deleteByIds(ids)
      expect(returnValue).toBe(false)
    })
  })

  describe('#findById', () => {
    it('should call adapter#findById', async () => {
      expect.assertions(1)
      const id = 1
      const options = {}
      await datastore.findById(id, options)
      expect(datastore.adapter.findById).toHaveBeenCalledWith(id, options)
    })

    it('should return entity', async () => {
      expect.assertions(1)
      const id = 1
      const found = await datastore.findById(id)
      expect(found).toEqual(getEntityWithId())
    })
  })

  describe('#findByIds', () => {
    it('should call adapter#findByIds', async () => {
      expect.assertions(1)
      const ids = [1, 2]
      const options = {}
      await datastore.findByIds(ids, options)
      expect(datastore.adapter.findByIds).toHaveBeenCalledWith(ids, options)
    })

    it('should return entities', async () => {
      expect.assertions(1)
      const ids = [1, 2]
      const found = await datastore.findByIds(ids)
      expect(found).toEqual([getEntityWithId(1, 1), getEntityWithId(2, 2)])
    })
  })

  describe('#findOne', () => {
    it('should call adapter#findOne', async () => {
      expect.assertions(1)
      const filter = { name: 'name-1' }
      const options = {}
      await datastore.findOne(filter, options)
      expect(datastore.adapter.findOne).toHaveBeenCalledWith(filter, options)
    })

    it('should call adapter findOne', async () => {
      expect.assertions(1)
      const filter = { name: 'name-1' }
      const found = await datastore.findOne(filter)
      expect(found).toEqual(getEntityWithId())
    })
  })

  describe('#find', () => {
    it('should call adapter#find', async () => {
      expect.assertions(1)
      const filter = { name: 'name-1' }
      const options = {}
      await datastore.find(filter, options)
      expect(datastore.adapter.find).toHaveBeenCalledWith(filter, options)
    })

    it('should return found entities', async () => {
      expect.assertions(1)
      const filter = { name: 'name-1' }
      const found = await datastore.find(filter)
      expect(found).toEqual([getEntityWithId(1, 1), getEntityWithId(2, 2)])
    })
  })

  describe('#count', () => {
    it('should call adapter#count', async () => {
      expect.assertions(1)
      const filter = { name: 'name-1' }
      const options = {}
      await datastore.count(filter, options)
      expect(datastore.adapter.count).toHaveBeenCalledWith(filter, options)
    })

    it('should return count', async () => {
      expect.assertions(1)
      const filter = { name: 'name-1' }
      const count = await datastore.count(filter)
      expect(count).toBe(1)
    })
  })

  describe('#transaction', () => {
    beforeEach(() => {
      datastore.adapter = transactionAwareAdatper()
    })

    it('should call adapter#transaction', async () => {
      expect.assertions(1)
      const cb = () => null
      await datastore.transaction(cb)
      expect(datastore.adapter.transaction).toHaveBeenCalledWith(cb)
    })
  })
})
