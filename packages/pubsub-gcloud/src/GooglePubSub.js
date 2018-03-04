import GooglePubSubManager from './GooglePubSubMananger'

export default class GooglePubSub {
  /**
   * @param {object} options all options supported by google pubsub node library
   * @param {object} [options.pubsub]
   * @param {number} [options.parallelAdminOperations=20]
   * @param {boolean} [options.json=true] serialize json JSON.parse and JSON.stringify
   */
  constructor (options) {
    this.options = Object.assign({
      json: true,
      parallelAdminOperations: 20
    }, options)

    this.manager = new GooglePubSubManager({
      pubsub: this.options.pubsub,
      parallelAdminOperations: this.options.parallelAdminOperations
    })
  }

  convertMessage (message) {
    let data = message.data.toString()
    if (this.options.json) {
      try {
        data = JSON.parse(data)
      } catch (e) {
        // ignore
      }
    }

    return {
      id: message.id,
      data: data,
      attributes: message.attributes,
      ack: () => message.ack(),
      nack: () => message.nack()
    }
  }

  /**
   * @param {string} topicName
   * @param {string|object|Buffer} data
   * @param {*} [attributes]
   * @param {*} [options]
   */
  async publish (topicName, data, attributes, options) {
    if (this.options.json) {
      data = JSON.stringify(data)
    }

    const publisher = await this.manager.ensurePublisher(topicName, options)
    return publisher.publish(Buffer.from(data), attributes)
  }

  /**
   * @param {string} topicName
   * @param {object} [options]
   * @param {string} [options.groupName]
   * @param {*} cb
   */
  async subscribe (topicName, options, cb) {
    if (arguments.length === 2) {
      cb = options
      options = {}
    }
    const subscription = await this.manager.ensureSubscription(topicName, options)
    subscription.on('message', (message) => cb(this.convertMessage(message)))
  }
}
