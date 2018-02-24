import JSONSchemaValidator from '../JSONSchemaValidator'

describe('JSONSchemaValidator', () => {
  const schema = {
    type: 'object',
    properties: {
      a: {
        type: 'number',
        default: 10
      },
      b: {
        type: 'number'
      }
    }
  }

  const validator = new JSONSchemaValidator(schema)

  it('should implement interface methods', () => {
    expect(validator.schema).toBeDefined()
    expect(validator.validate).toBeDefined()
    expect(validator.schema).toEqual(schema)
  })

  describe('#validate', () => {
    it('should resolve with value on valid', () => {
      expect.assertions(1)
      return expect(validator.validate({ a: 1 })).resolves.toEqual({ a: 1 })
    })

    it('should resolve with default values populated on valid', () => {
      expect.assertions(1)
      return expect(validator.validate({})).resolves.toEqual({ a: 10 })
    })

    it('should reject with errors when given invalid data', async () => {
      expect.assertions(4)
      return validator.validate({ a: '1' }).catch((err) => {
        expect(err.message).toBe('Parameters validation error!')
        expect(err.code).toBe(422)
        expect(err.type).toBe('validation_error')
        expect(err.data).toEqual([{
          keyword: 'type',
          dataPath: '.a',
          schemaPath: '#/properties/a/type',
          params: { type: 'number' },
          message: 'should be number'
        }])
      })
    })
  })
})
