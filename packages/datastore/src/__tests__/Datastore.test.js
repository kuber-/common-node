import Datastore from '../Datastore'

describe('Datastore', () => {
  const datastore = new Datastore({
    adapter: {},
    schema: {}
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
})
