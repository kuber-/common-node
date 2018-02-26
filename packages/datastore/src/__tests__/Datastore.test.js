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
    expect(datastore.updateMany).toBeDefined()
    expect(datastore.deleteById).toBeDefined()
    expect(datastore.deleteByIds).toBeDefined()
    expect(datastore.deleteMany).toBeDefined()
    expect(datastore.findById).toBeDefined()
    expect(datastore.findByIds).toBeDefined()
    expect(datastore.findOne).toBeDefined()
    expect(datastore.find).toBeDefined()
    expect(datastore.count).toBeDefined()
  })

  it('should have private methods', () => {
    expect(datastore.getAdapter).toBeDefined()
    expect(datastore.notify).toBeDefined()
    expect(datastore.convertUpdate).toBeDefined()
    expect(datastore.invokeAdapterMethod).toBeDefined()
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
        entities: [getEntityWithId()],
        insertedCount: 1
      })
    })
  })

  describe('#insertMany', () => {
    it('should call adapter insertMany', async () => {
      expect.assertions(4)
      const entities = [getEntity(1), getEntity(2)]
      const options = {}
      const insertedEntities = await datastore.insertMany(entities, options)
      expect(insertedEntities).toEqual([getEntityWithId(1, 1), getEntityWithId(2, 2)])
      expect(datastore.schema.validate).toHaveBeenCalledTimes(2)
      expect(datastore.adapter.insertMany).toHaveBeenCalledWith(entities, options)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.created`, {
        entities: insertedEntities,
        insertedCount: 2
      })
    })
  })

  describe('#updateById', () => {
    it('should call adapter updateById', async () => {
      expect.assertions(5)
      const id = 1
      const update = { name: 'name-1' }
      const options = {}
      const convertedUpdate = datastore.convertUpdate(update)
      const updatedEntity = await datastore.updateById(id, update, options)
      expect(updatedEntity).toEqual(getEntityWithId())
      expect(datastore.schema.validate).toHaveBeenCalledTimes(1)
      expect(datastore.schema.validate).toHaveBeenCalledWith(convertedUpdate.validate, true)
      expect(datastore.adapter.updateById).toHaveBeenCalledWith(id, convertedUpdate.update, options)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.updated`, {
        entities: [updatedEntity],
        updatedCount: 1
      })
    })
  })

  describe('#updateMany', () => {
    it('should call adapter updateMany', async () => {
      expect.assertions(5)
      const filter = { name: 'name-1' }
      const update = { name: 'name' }
      const options = {}
      const convertedUpdate = datastore.convertUpdate(update)
      const updatedCount = await datastore.updateMany(filter, update, options)
      expect(updatedCount).toBe(1)
      expect(datastore.schema.validate).toHaveBeenCalledTimes(1)
      expect(datastore.schema.validate).toHaveBeenCalledWith(convertedUpdate.validate, true)
      expect(datastore.adapter.updateMany).toHaveBeenCalledWith(filter, convertedUpdate.update, options)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.updated`, {
        filter,
        updatedCount
      })
    })
  })

  describe('#deleteById', () => {
    it('should call adapter deleteById', async () => {
      expect.assertions(3)
      const id = 1
      const options = {}
      const deletedId = await datastore.deleteById(id, options)
      expect(deletedId).toBe(id)
      expect(datastore.adapter.deleteById).toHaveBeenCalledWith(id, options)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.deleted`, {
        ids: [deletedId],
        deletedCount: 1
      })
    })
  })

  describe('#deleteByIds', () => {
    it('should call adapter deleteByIds', async () => {
      expect.assertions(3)
      const ids = [1, 2]
      const options = {}
      const deletedIds = await datastore.deleteByIds(ids, options)
      expect(deletedIds).toEqual(ids)
      expect(datastore.adapter.deleteByIds).toHaveBeenCalledWith(ids, options)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.deleted`, {
        ids,
        deletedCount: 2
      })
    })
  })

  describe('#deleteMany', () => {
    it('should call adapter deleteMany', async () => {
      expect.assertions(3)
      const filter = { name: 'name-1' }
      const options = {}
      const deletedCount = await datastore.deleteMany(filter, options)
      expect(deletedCount).toBe(1)
      expect(datastore.adapter.deleteMany).toHaveBeenCalledWith(filter, options)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.deleted`, {
        filter,
        deletedCount
      })
    })
  })

  describe('#findById', () => {
    it('should call adapter findById', async () => {
      expect.assertions(2)
      const id = 1
      const options = {}
      const found = await datastore.findById(id, options)
      expect(found).toEqual(getEntityWithId())
      expect(datastore.adapter.findById).toHaveBeenCalledWith(id, options)
    })
  })

  describe('#findByIds', () => {
    it('should call adapter findByIds', async () => {
      expect.assertions(2)
      const ids = [1, 2]
      const options = {}
      const found = await datastore.findByIds(ids, options)
      expect(found).toEqual([getEntityWithId(1, 1), getEntityWithId(2, 2)])
      expect(datastore.adapter.findByIds).toHaveBeenCalledWith(ids, options)
    })
  })

  describe('#findOne', () => {
    it('should call adapter findOne', async () => {
      expect.assertions(2)
      const filter = { name: 'name-1' }
      const options = {}
      const found = await datastore.findOne(filter, options)
      expect(found).toEqual(getEntityWithId())
      expect(datastore.adapter.findOne).toHaveBeenCalledWith(filter, options)
    })
  })

  describe('#find', () => {
    it('should call adapter find', async () => {
      expect.assertions(2)
      const filter = { name: 'name-1' }
      const options = {}
      const found = await datastore.find(filter, options)
      expect(found).toEqual([getEntityWithId(1, 1), getEntityWithId(2, 2)])
      expect(datastore.adapter.find).toHaveBeenCalledWith(filter, options)
    })
  })

  describe('#count', () => {
    it('should call adapter count', async () => {
      expect.assertions(2)
      const filter = { name: 'name-1' }
      const options = {}
      const count = await datastore.count(filter, options)
      expect(count).toBe(1)
      expect(datastore.adapter.count).toHaveBeenCalledWith(filter, options)
    })
  })
})
