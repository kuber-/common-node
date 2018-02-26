import Datastore from '../Datastore'

const defaultAdapter = () => ({
  init: jest.fn()
})

const defaultSchemaName = 'defaultSchema'
const defaultSchema = () => ({
  name: defaultSchemaName,
  validate: jest.fn()
})

describe('Datastore', () => {
  let datastore = null

  beforeEach(() => {
    datastore = new Datastore({
      adapter: defaultAdapter(),
      schema: defaultSchema()
    })
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
      }]

      tests.forEach((value) => {
        expect(datastore.convertUpdate(value.given)).toEqual(value.expected)
      })
    })
  })

  describe('#notfy', () => {
    it('emit passed event and global event', async () => {
      expect.assertions(3)
      datastore.emit = jest.fn()
      await datastore.notify('test event', {})
      expect(datastore.emit).toHaveBeenCalledTimes(2)
      expect(datastore.emit).toHaveBeenCalledWith('test event', {})
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
    it('should call adapter insertOne', async () => {
      expect.assertions(3)
      const entity = {}
      const options = {}
      datastore.notify = jest.fn()
      datastore.adapter.insertOne = jest.fn(() => entity)
      await datastore.insertOne(entity, options)
      expect(datastore.schema.validate).toHaveBeenCalledWith(entity)
      expect(datastore.adapter.insertOne).toHaveBeenCalledWith(entity, options)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.created`, {
        entities: [entity],
        insertedCount: 1
      })
    })
  })

  describe('#insertMany', () => {
    it('should call adapter insertMany', async () => {
      expect.assertions(3)
      const entities = [{}, {}]
      const options = {}
      datastore.notify = jest.fn()
      datastore.adapter.insertMany = jest.fn(() => entities)
      await datastore.insertMany(entities, options)
      expect(datastore.schema.validate).toHaveBeenCalledTimes(2)
      expect(datastore.adapter.insertMany).toHaveBeenCalledWith(entities, options)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.created`, {
        entities: entities,
        insertedCount: 2
      })
    })
  })

  describe('#updateById', () => {
    it('should call adapter updateById', async () => {
      expect.assertions(4)
      const id = 1
      const update = { name: 'name' }
      const updatedEntity = {}
      const options = {}
      const convertedUpdate = datastore.convertUpdate(update)
      datastore.notify = jest.fn()
      datastore.adapter.updateById = jest.fn(() => updatedEntity)
      await datastore.updateById(id, update, options)
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
      expect.assertions(4)
      const filter = { joined: true }
      const update = { name: 'name' }
      const options = {}
      const convertedUpdate = datastore.convertUpdate(update)
      datastore.notify = jest.fn()
      datastore.adapter.updateMany = jest.fn(() => 1)
      await datastore.updateMany(filter, update, options)
      expect(datastore.schema.validate).toHaveBeenCalledTimes(1)
      expect(datastore.schema.validate).toHaveBeenCalledWith(convertedUpdate.validate, true)
      expect(datastore.adapter.updateMany).toHaveBeenCalledWith(filter, convertedUpdate.update, options)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.updated`, {
        filter,
        updatedCount: 1
      })
    })
  })

  describe('#deleteById', () => {
    it('should call adapter deleteById', async () => {
      expect.assertions(2)
      const id = 1
      const options = {}
      datastore.notify = jest.fn()
      datastore.adapter.deleteById = jest.fn(() => id)
      await datastore.deleteById(id, options)
      expect(datastore.adapter.deleteById).toHaveBeenCalledWith(id, options)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.deleted`, {
        ids: [id],
        deletedCount: 1
      })
    })
  })

  describe('#deleteByIds', () => {
    it('should call adapter deleteByIds', async () => {
      expect.assertions(2)
      const ids = [1, 2]
      const options = {}
      datastore.notify = jest.fn()
      datastore.adapter.deleteByIds = jest.fn(() => ids)
      await datastore.deleteByIds(ids, options)
      expect(datastore.adapter.deleteByIds).toHaveBeenCalledWith(ids, options)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.deleted`, {
        ids,
        deletedCount: 2
      })
    })
  })

  describe('#deleteMany', () => {
    it('should call adapter deleteMany', async () => {
      expect.assertions(2)
      const filter = { joined: true }
      const options = {}
      datastore.notify = jest.fn()
      datastore.adapter.deleteMany = jest.fn(() => 1)
      await datastore.deleteMany(filter, options)
      expect(datastore.adapter.deleteMany).toHaveBeenCalledWith(filter, options)
      expect(datastore.notify).toHaveBeenCalledWith(`${defaultSchemaName}.deleted`, {
        filter,
        deletedCount: 1
      })
    })
  })

  describe('#findById', () => {
    it('should call adapter findById', async () => {
      expect.assertions(1)
      const id = 1
      const options = {}
      datastore.adapter.findById = jest.fn()
      await datastore.findById(id, options)
      expect(datastore.adapter.findById).toHaveBeenCalledWith(id, options)
    })
  })

  describe('#findByIds', () => {
    it('should call adapter findByIds', async () => {
      expect.assertions(1)
      const ids = []
      const options = {}
      datastore.adapter.findByIds = jest.fn()
      await datastore.findByIds(ids, options)
      expect(datastore.adapter.findByIds).toHaveBeenCalledWith(ids, options)
    })
  })

  describe('#findOne', () => {
    it('should call adapter findOne', async () => {
      expect.assertions(1)
      const filter = { joined: true }
      const options = {}
      datastore.adapter.findOne = jest.fn()
      await datastore.findOne(filter, options)
      expect(datastore.adapter.findOne).toHaveBeenCalledWith(filter, options)
    })
  })

  describe('#find', () => {
    it('should call adapter find', async () => {
      expect.assertions(1)
      const filter = { joined: true }
      const options = {}
      datastore.adapter.find = jest.fn()
      await datastore.find(filter, options)
      expect(datastore.adapter.find).toHaveBeenCalledWith(filter, options)
    })
  })

  describe('#count', () => {
    it('should call adapter count', async () => {
      expect.assertions(1)
      const filter = { joined: true }
      const options = {}
      datastore.adapter.count = jest.fn()
      await datastore.count(filter, options)
      expect(datastore.adapter.count).toHaveBeenCalledWith(filter, options)
    })
  })
})
