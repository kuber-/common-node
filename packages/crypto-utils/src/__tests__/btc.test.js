import BTC from '../btc'

it('should expose btc object', () => {
  expect(BTC).toBeDefined()
  expect(BTC).toBe(BTC)
})

it('should have generateAddress', () => {
  expect(BTC.generateAddress).toBeDefined()
  expect(BTC.generateAddress).toBeInstanceOf(Function)
})

it('generates an address', () => {
  expect(BTC.generateAddress()).toMatchObject({
    address: expect.stringMatching(/^\w+$/g),
    privateKey: expect.stringMatching(/^\w+$/g)
  })
})
