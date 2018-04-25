import bicoinjs, { ECPair } from 'bitcoinjs-lib'

bicoinjs.networks.regtest = {
  messagePrefix: '\x18Bitcoin Signed Message:\n',
  bech32: 'rb',
  bip32: {
    public: 0xeab4fa05,
    private: 0xeab404c7
  },
  pubKeyHash: 0x3c,
  scriptHash: 0x26,
  wif: 0x5a
}

/**
 * Generates a new address for Bitcoin.
 * @return {AccountAddress} Newly generated account address.
 */
const generateAddress = (network) => {
  network = network || 'bitcoin'
  const keyPair = ECPair.makeRandom({ network: bicoinjs.networks[network] })
  const privateKey = keyPair.toWIF()
  const address = keyPair.getAddress()

  // address matches /^\w{26,34}$/
  return {
    address,
    privateKey
  }
}

export default {
  generateAddress
}
