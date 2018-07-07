import series from 'async/series'
import { ConsumerGroup, HighLevelProducer, KafkaClient } from 'kafka-node'

export default class KafkaPubSub {
  options;
  connectPromise;
  client;
  producer;
  consumers;

  /**
   * @param {object} options
   * @param {object} options.kafka
   * @param {boolean} [options.json=true] serialize json JSON.parse and JSON.stringify
   */
  constructor (options) {
    this.options = Object.assign({
      json: true
    }, options)

    this.client = new KafkaClient({ ...options.kafka, autoConnect: false })
    this.consumers = []
  }

  createPublishCallback (resolve, reject) {
    return function (error, data) {
      if (!error) {
        resolve(data)
      }

      // TODO: handle any errors that can be retried
      reject(error)
    }
  }

  async connect () {
    if (!this.connectPromise) {
      this.connectPromise = new Promise((resolve, reject) => {
        if (this.producer) {
          return resolve()
        }

        series([
          (cb) => {
            const errorHandler = err => cb(err)
            this.client.once('error', errorHandler)
            this.client.once('ready', () => {
              this.client.removeListener('error', errorHandler)
              cb()
            })
            this.client.connect()
            process.on('exit', this.disconnect.bind(this))
          },
          (cb) => {
            this.producer = new HighLevelProducer(this.client)
            cb()
          }
        ], (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    }

    return this.connectPromise
  }

  async disconnect () {
    // TODO: should we do anything here??
    this.consumers.forEach(consumer => consumer.close(true, () => null))
    this.consumers = []
    this.client.close(() => null)
  }

  convertMessage (message) {
    let data = message.value.toString()
    if (this.options.json) {
      try {
        data = JSON.parse(data)
      } catch (e) {
        data = message
      }
    }

    return {
      id: `${message.partition}:${message.offset}`,
      message: data,
      meta: {
        offset: message.offset,
        partition: message.partition,
        highWaterOffset: message.highWaterOffset,
        key: message.key,
        timestamp: message.timestamp
      }
    }
  }

  /**
   * @param {string} topicName
   * @param {*} message
   * @param {object} [options]
   * @param {*} [options.timestamp] check kafkajs docs
   */
  async publish (topicName, message, options) {
    const messages = options && options.batch ? message : [message]

    return new Promise((resolve, reject) => {
      this.producer.send([{
        topic: topicName,
        messages: this.options.json ? messages.map(message => JSON.stringify(message)) : messages,
        timestamp: options && options.timestamp
      }], this.createPublishCallback(resolve, reject))
    })
  }

  /**
   * @param {string} topicName
   * @param {*} cb
   * @param {object} [options]
   * @param {string} [options.groupName]
   * @param {string} [options.groupId]
   */
  async subscribe (topicName, cb, options) {
    const {
      groupName,
      groupId
    } = options

    const consumer = await new ConsumerGroup({
      ...this.options.kafka,
      groupId: groupId || groupName,
      fromOffset: 'latest'
    }, [topicName])

    this.consumers.push(consumer)
    consumer.on('message', message => cb(this.convertMessage(message)))
  }
}
