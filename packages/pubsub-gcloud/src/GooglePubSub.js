import PubSub from '@google-cloud/pubsub'

export default class GooglePubSub {
  /**
   * @param {object} options all options supported by google pubsub node library
   * @param {object} [options.pubsub]
   * @param {boolean} [options.json=true] serialize json JSON.parse and JSON.stringify
   */
  constructor (options) {
    this.options = Object.assign({
      json: true
    }, options)

    this.client = new PubSub(this.options.pubsub)
    this.topics = {}
    this.subscriptions = {}
    this.publishers = {}
  }

  async ensureTopic (topicName, options, retries = 10) {
    if (!this.topics[topicName]) {
      try {
        const topic = this.client.topic(topicName)
        const exists = await topic.exists().then((data) => data[0])
        if (!exists) {
          await topic.create()
        } else {
          await topic.get()
        }

        this.topics[topicName] = topic
        this.publishers[topicName] = topic.publisher()
      } catch (e) {
        if (retries > 0) {
          return this.ensureTopic(topicName, --retries)
        }

        throw e
      }
    }

    return this.topics[topicName]
  }

  async ensurePublisher (topicName, options, retries = 10) {
    if (!this.publishers[topicName]) {
      const topic = await this.ensureTopic(topicName, options, retries)
      this.publishers[topicName] = topic.publisher()
    }

    return this.publishers[topicName]
  }

  async ensureSubscription (topicName, options, retries = 10) {
    const subscriptionName = options.groupName
    if (!this.subscriptions[subscriptionName]) {
      const topic = await this.ensureTopic(topicName)
      const subscription = topic.subscription(subscriptionName)
      try {
        const exists = subscription.exists().then((data) => data[0])
        if (!exists) {
          // FIXME seeing some auth error if not using subscription.create()
          await this.client.createSubscription(topicName, subscriptionName)
        }

        await subscription.get()
        this.subscriptions[subscriptionName] = subscription
      } catch (e) {
        if (retries > 0) {
          return this.ensureSubscription(topicName, options, --retries)
        }

        throw e
      }
    }

    return this.subscriptions[subscriptionName]
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

    data = Buffer.from(data)
    const publisher = await this.ensurePublisher(topicName, options)
    return publisher.publish(data, attributes)
  }

  /**
   * @param {string} topicName
   * @param {object} [options]
   * @param {string} options.groupName
   * @param {*} cb
   */
  async subscribe (topicName, options = {}, cb) {
    const subscription = await this.ensureSubscription(topicName, options)
    subscription.on('message', (message) => cb(this.convertMessage(message)))
  }
}
