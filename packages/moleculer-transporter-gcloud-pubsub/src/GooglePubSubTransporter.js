import PubSub from '@ten-bits/pubsub-gcloud'
import { Transporters } from 'moleculer'
import { PACKET_REQUEST, PACKET_EVENT } from 'moleculer/src/packets'

const { Base } = Transporters

export default class GooglePubSubTransporter extends Base {
  /**
   * @param {object} opts
   * @param {object} [opts.pubsub]
   */
  constructor (opts = {}) {
    super(opts)

    this.hasBuiltInBalancer = true
    this.pubsub = null
  }

  /**
   * @param {string} topicName
   */
  _cleanTopicName (topicName) {
    // pubsub does not accept $ character
    return topicName.replace('$', '')
  }

  async connect () {
    this.pubsub = new PubSub(Object.assign({
      json: false,
      pubsub: this.opts.pubsub
    }))
    return this.onConnected()
  }

  async disconnect () {
    this.pubsub = null
  }

  async subscribe (cmd, nodeID) {
    const topicName = this._cleanTopicName(this.getTopicName(cmd, nodeID))
    return this.pubsub.subscribe(topicName, (message) => {
      this.incomingMessage(cmd, message.data)
      message.ack()
    })
  }

  async subscribeBalancedRequest (action) {
    const topicName = this._cleanTopicName(`${this.prefix}.${PACKET_REQUEST}B.${action}`)
    return this.pubsub.subscribe(topicName, (message) => {
      this.incomingMessage(PACKET_REQUEST, message.data)
      message.ack()
    })
  }

  async subscribeBalancedEvent (event, group) {
    const topicName = this._cleanTopicName(`${this.prefix}.${PACKET_EVENT}B.${group}.${event}`)
    return this.pubsub.subscribe(topicName, (message) => {
      this.incomingMessage(PACKET_EVENT, message.data)
      message.ack()
    })
  }

  async publish (packet) {
    const topicName = this._cleanTopicName(this.getTopicName(packet.type, packet.target))
    const data = this.serialize(packet)
    return this.pubsub.publish(topicName, data)
  }

  async publishBalancedRequest (packet) {
    const topicName = this._cleanTopicName(`${this.prefix}.${PACKET_REQUEST}B.${packet.payload.action}`)
    const data = this.serialize(packet)
    return this.pubsub.publish(topicName, data)
  }

  async publishBalancedEvent (packet, group) {
    let topicName = this._cleanTopicName(`${this.prefix}.${PACKET_EVENT}B.${group}.${packet.payload.event}`)
    const data = this.serialize(packet)
    return this.pubsub.publish(topicName, data)
  }
}
