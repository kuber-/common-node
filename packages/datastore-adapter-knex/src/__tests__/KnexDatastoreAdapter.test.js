import KnexDatastoreAdapter from '../KnexDatastoreAdapter'
import knex from 'knex'

jest.mock('knex', () => {
  return jest.fn().mockImplementation(() => {
    return jest.fn()
  })
})

const defaultOptions = {
  tableName: 'test',
  identifier: 'id',
  knexOptions: {}
}

const defaultSchema = {
  name: 'test'
}

describe('KnexDatastoreAdapter', () => {
  let adapter = null

  beforeEach(() => {
    adapter = new KnexDatastoreAdapter(defaultOptions)
    adapter.init({ schema: defaultSchema })
  })

  afterEach(() => {
    knex.mockClear()
  })

  it('should have interface methods', () => {
    expect(adapter.init).toBeDefined()
    expect(adapter.insertOne).toBeDefined()
    expect(adapter.insertMany).toBeDefined()
    expect(adapter.updateById).toBeDefined()
    expect(adapter.deleteById).toBeDefined()
    expect(adapter.deleteByIds).toBeDefined()
    expect(adapter.findById).toBeDefined()
    expect(adapter.findByIds).toBeDefined()
    expect(adapter.findOne).toBeDefined()
    expect(adapter.find).toBeDefined()
    expect(adapter.count).toBeDefined()
    expect(adapter.raw).toBeDefined()
    expect(adapter.transaction).toBeDefined()
  })

  it('should have private methods', () => {
    expect(adapter.options).toEqual(defaultOptions)
    expect(adapter.getDBFromOptions).toBeDefined()
    expect(adapter.createCursor).toBeDefined()
  })

  describe('#init', () => {
    it('should connect using knex', () => {
      expect(knex).toHaveBeenCalledTimes(1)
      expect(knex).toHaveBeenCalledWith(defaultOptions.knexOptions)
    })

    it('should populate instance values', () => {
      expect(adapter.schema).toBe(defaultSchema)
      expect(adapter.tableName).toBe(defaultSchema.name)
      expect(adapter.identifier).toBe('id')
      expect(adapter.db).toBeDefined()
    })
  })
})
