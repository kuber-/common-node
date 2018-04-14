import crypto from 'crypto'
import keyPairs from 'ripple-keypairs'

/**
 * Generates a new address for Ripple.
 * @return {AccountAddress} Newly generated account address.
 */
const generateAddress = () => {
  const privateKey = keyPairs.generateSeed(crypto.randomBytes(256))
  const keypair = keyPairs.deriveKeypair(privateKey)
  const address = keyPairs.deriveAddress(keypair.publicKey)

  // address format matches /^r\w{25,35}$/
  return Object.assign({ privateKey, address })
}

export default {
  generateAddress
}
