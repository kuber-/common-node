import XRP from '../xrp'
import BTC from '../btc'
import ETH from '../eth'
import * as all from '../index'

describe('index', () => {
  it('should export correct interface', () => {
    expect(all.XRP).toBeDefined()
    expect(all.BTC).toBeDefined()
    expect(all.ETH).toBeDefined()
    expect(all.XRP).toBe(XRP)
    expect(all.BTC).toBe(BTC)
    expect(all.ETH).toBe(ETH)
  })
})
