import ETH from '../eth'

it('should expose ETH object', () => {
  expect(ETH).toBeDefined()
  expect(ETH).toBe(ETH)
})

it('should have generateAddress', () => {
  expect(ETH.generateAddress).toBeDefined()
  expect(ETH.generateAddress).toBeInstanceOf(Function)
})

it('generates an address', () => {
  expect(ETH.generateAddress()).toMatchObject({
    address: expect.stringMatching(/^0x\w+$/g),
    privateKey: expect.stringMatching(/^\w+$/g)
  })
})
