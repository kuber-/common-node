import Ajv from 'ajv'

export default class JSONSchemaValidator {
  /**
   * @param {object} schema json schema
   * @param {object} [options]
   */
  constructor (schema, options) {
    this.schema = schema
    this.ajv = new Ajv(Object.assign({
      allErrors: true,
      useDefaults: true
    }, options))

    this.validator = this.ajv.compile(this.schema)
  }

  /**
   * Mutates data, i.e populates default values from json schema
   *
   * @param {*} data
   */
  validateSync (data) {
    const valid = this.validator(data)
    return valid !== true ? this.validator.errors : valid
  }

  /**
   * Mutates data, i.e populates default values from json schema
   *
   * @param {*} data
   */
  async validate (data) {
    return new Promise((resolve, reject) => {
      const valid = this.validateSync(data)
      return valid === true ? resolve(data) : reject(valid)
    })
  }
}
