import Datastore from '../Datastore'
import Schema from '../Schema'
import * as all from '../index'

describe('index', () => {
  it('should export correct interface', () => {
    expect(all.Datastore).toBeDefined()
    expect(all.Schema).toBeDefined()
    expect(all.Datastore).toBe(Datastore)
    expect(all.Schema).toBe(Schema)
  })
})
