import XRP from '../xrp'

it('should expose XRP object', () => {
  expect(XRP).toBeDefined()
  expect(XRP).toBe(XRP)
})

it('should have generateAddress', () => {
  expect(XRP.generateAddress).toBeDefined()
  expect(XRP.generateAddress).toBeInstanceOf(Function)
})

it('generates an address', () => {
  expect(XRP.generateAddress()).toMatchObject({
    address: expect.stringMatching(/^r\w+$/g),
    privateKey: expect.stringMatching(/^\w+$/g)
  })
})
