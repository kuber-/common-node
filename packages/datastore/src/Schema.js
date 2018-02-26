import JSONSchemaValidator from '@ten-bits/json-schema-validator'
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

    // validators
    this.createValidator = new JSONSchemaValidator(this.createSchema)
    this.updateValidator = new JSONSchemaValidator(this.updateSchema)
  }

  async validateCreate (data) {
    return this.createValidator.validate(data)
  }

  async validateUpdate (data) {
    return this.updateValidator.validate(data)
  }

  async validate (data, onUpdate = false) {
    return onUpdate ? this.validateUpdate(data) : this.validateCreate(data)
  }
}
