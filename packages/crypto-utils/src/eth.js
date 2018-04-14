import crypto from 'crypto'
import Web3 from 'web3'

const web3 = new Web3()

/**
 * @typedef {Object} AccountAddress
 * @property {string} privateKey The account secret.
 * @property {string} address The account public address.
 */

/**
 * Generates a new address for Ethereum.
 * @return {AccountAddress}
 * Newly generated account address.
 */
export const generateAddress = () => {
  const entropy = `${crypto.randomBytes(256).toString('hex')}`
  // address matches /^0x\w{40}$/
  return web3.eth.accounts.create(entropy)
}

export default {
  generateAddress
}
