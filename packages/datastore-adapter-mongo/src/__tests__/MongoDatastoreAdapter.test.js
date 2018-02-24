import MongoDatastoreAdapter from '../MongoDatastoreAdapter'

describe('MongoDatastoreAdapter', () => {
  it('should have interface methods', () => {
    const adapter = new MongoDatastoreAdapter()
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
})
