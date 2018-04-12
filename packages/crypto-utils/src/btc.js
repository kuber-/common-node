// import crypto from 'crypto'
// import bitcoin, { ECPair } from 'bitcoinjs-lib'
import bitcoin from 'bitcoinjs-lib'

class Btc {
  client

  constructor (client) {
    this.client = client
  }

  createAddress () {
    // const keyPair = this.client.ECPair.makeRandom({ rng: () => crypto.randomBytes(32) })
    // var wif = keyPair.toWIF()
    // var address = keyPair.getAddress()
    return {}
  }
}

const btc = new Btc(bitcoin)
btc.createAddress()

export default btc
