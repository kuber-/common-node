import crypto from 'crypto'
// import { RippleAPI } from 'ripple-lib'
import keyPairs from 'ripple-keypairs'

// const ripple = new RippleAPI()

/**
 * Generates a new address for Ripple.
 * @return {AccountAddress} Newly generated account address.
 */
const generateAddress = () => {
  const secret = keyPairs.generateSeed(crypto.randomBytes(256))
  const keypair = keyPairs.deriveKeypair(secret)
  const address = keyPairs.deriveAddress(keypair.publicKey)

  return Object.assign({}, keypair, { address })
}

export default {
  generateAddress
}
