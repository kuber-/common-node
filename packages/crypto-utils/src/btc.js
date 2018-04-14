import { ECPair } from 'bitcoinjs-lib'

/**
 * Generates a new address for Bitcoin.
 * @return {AccountAddress} Newly generated account address.
 */
const generateAddress = () => {
  const keyPair = ECPair.makeRandom()
  const address = keyPair.getAddress()
  var privateKey = keyPair.toWIF()

  // address matches /^\w{26,34}$/
  return {
    address,
    privateKey
  }
}

export default {
  generateAddress
}
