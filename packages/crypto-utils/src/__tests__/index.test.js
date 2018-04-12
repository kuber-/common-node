import xrp from '../xrp'
import * as all from '../index'

describe('index', () => {
  it('should export correct interface', () => {
    expect(all.xrp).toBeDefined()
    expect(all.xrp).toBeDefined()
    expect(all.xrp).toBe(xrp)
  })
})
