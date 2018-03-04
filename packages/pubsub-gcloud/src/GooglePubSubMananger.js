import PubSub from '@google-cloud/pubsub'
import queue from 'async/queue'

export default class GooglePubSubManager {
  /**
   * @param {object} [options]
   * @param {object} [options.pubsub] all options supported by google pubsub node library
   * @param {number} [options.parallelAdminOperations=20]
   */
  constructor (options) {
    this.options = Object.assign({
      parallelAdminOperations: 20
    }, options)
    this.client = new PubSub(this.options.pubsub)

    // cache so we do not have to create again
    this.topics = {}
    this.subscriptions = {}
    this.publishers = {}

    // safety limit so we dont hit google administrative tasks limit
    this.queue = queue((task, cb) => {
      task().then((result) => cb(null, result)).catch((err) => cb(err))
    }, this.options.parallelAdminOperations)
  }

  async task (task) {
    return new Promise((resolve, reject) => {
      this.queue.push(task, (err, result) => err ? reject(err) : resolve(result))
    })
  }

  /**
   * Creates topic if does not exist
   *
   * @param {string} topicName
   * @param {*} options
   */
  async ensureTopic (topicName, options) {
    if (!this.topics[topicName]) {
      const topic = this.client.topic(topicName)
      const exists = await this.task(() => topic.exists().then((data) => data[0]))
      if (!exists) {
        await this.task(() => this.client.createTopic(topicName))
      }

      this.topics[topicName] = topic
    }

    return this.topics[topicName]
  }

  /**
   *
   * @param {string} topicName
   * @param {*} options
   */
  async ensurePublisher (topicName, options) {
    if (!this.publishers[topicName]) {
      const topic = await this.ensureTopic(topicName, options)
      this.publishers[topicName] = topic.publisher()
    }

    return this.publishers[topicName]
  }

  async ensureSubscription (topicName, options) {
    const subscriptionName = options.groupName || topicName
    if (!this.subscriptions[subscriptionName]) {
      let subscription = this.client.subscription(subscriptionName)
      const exists = await this.task(() => subscription.exists().then((data) => data[0]))
      if (!exists) {
        await this.ensureTopic(topicName, options)
        await this.task(() => this.client.createSubscription(topicName, subscriptionName))
      }

      this.subscriptions[subscriptionName] = subscription
    }

    return this.subscriptions[subscriptionName]
  }
}
