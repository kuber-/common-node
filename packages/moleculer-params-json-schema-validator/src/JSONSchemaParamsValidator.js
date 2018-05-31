import { Validator, Errors } from 'moleculer'
import FastestValidator from 'fastest-validator'
import JSONSchemaValidator from '@tenbitscode/json-schema-validator'

const { ValidationError } = Errors

/**
 * Validator to support both fastest-validator and ajv for json schema
 */
export default class JSONSchemaParamsValidator extends Validator {
  /**
   *
   * @param {Object} opts
   * @param {Object} opts.messages
   * @param {Object} opts.rules
   */
  constructor (opts = {}) {
    super()

    this.validator = new FastestValidator({
      messages: opts.messages || {}
    })

    if (opts.rules) {
      Object.keys(opts.rules).forEach((ruleName) => {
        this.validator.add(ruleName, opts.rules[ruleName])
      })
    }
  }

  isJSONSchema (schema) {
    return schema.hasOwnProperty('$jsonSchema')
  }

  getJSONSchema (schema) {
    return schema.$jsonSchema
  }

  compile (schema) {
    if (this.isJSONSchema(schema)) {
      const validator = new JSONSchemaValidator(this.getJSONSchema(schema))
      return (params) => validator.validateSync(params)
    }

    return super.compile(schema)
  }

  // TODO: compile and cache schema so we don't compile every time here
  validate (params, schema) {
    if (this.isJSONSchema(schema)) {
      const validator = new JSONSchemaValidator(this.getJSONSchema(schema))
      const valid = validator.validateSync(params)
      if (valid === true) {
        return true
      }

      throw new ValidationError('Parameters validation error!', null, valid)
    }

    return super.validate(params, schema)
  }
}
