import Ajv from 'ajv'
import get from 'lodash/get'

export default class Schema {
  /**
   * @param {object} schema
   * @param {string} schema.name
   * @param {object} schema.entity
   * @param {object} schema.update
   */
  constructor (schema) {
    this.schema = schema
    this.name = this.schema.name

    // get schema
    this.entitySchema = get(schema, 'entity', {})
    this.createSchema = get(schema, ['validators', 'onCreate'], this.entitySchema)
    this.updateSchema = get(schema, ['validators', 'onUpdate'], {})

    // mark schemas as async
    this.entitySchema.$async = true
    this.createSchema.$async = true
    this.updateSchema.$async = true

    // ajv instance
    this.ajv = new Ajv({ allErrors: true, useDefaults: true })

    // validators
    this.entityValidator = this.ajv.compile(this.entitySchema)
    this.createValidator = this.ajv.compile(this.createSchema)
    this.updateValidator = this.ajv.compile(this.updateSchema)
  }

  internalCreateError (err) {
    const error = new Error('Parameters validation error!')
    error.code = 422
    error.type = 'validation_error'
    error.data = err.errors
    return error
  }

  async validateEntity (data) {
    const validator = this.entityValidator
    return validator(data).catch((error) => {
      return Promise.reject(this.internalCreateError(error))
    })
  }

  async validateCreate (data) {
    const validator = this.createValidator
    return validator(data).catch((error) => {
      return Promise.reject(this.internalCreateError(error))
    })
  }

  async validateUpdate (data) {
    const validator = this.updateValidator
    return validator(data).catch((error) => {
      return Promise.reject(this.internalCreateError(error))
    })
  }

  async validate (data, onUpdate = false) {
    return onUpdate ? this.validateUpdate(data) : this.validateCreate(data)
  }
}
