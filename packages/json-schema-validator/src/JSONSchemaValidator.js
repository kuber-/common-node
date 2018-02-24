import Ajv from 'ajv'

export default class JSONSchemaValidator {
  /**
   * @param {object} schema json schema
   * @param {object} [options]
   */
  constructor (schema, options) {
    this.schema = schema
    // mark schemas as async
    this.schema.$async = true
    // ajv instance
    this.ajv = new Ajv(Object.assign({
      allErrors: true,
      useDefaults: true
    }, options))

    this.validator = this.ajv.compile(this.schema)
  }

  internalCreateError (err) {
    const error = new Error('Parameters validation error!')
    error.code = 422
    error.type = 'validation_error'
    error.data = err.errors
    return error
  }

  async validate (data) {
    return this.validator(data).catch((error) => {
      return Promise.reject(this.internalCreateError(error))
    })
  }
}
