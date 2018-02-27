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
    expect(validator.schema).toEqual(schema)
    expect(validator.validate).toBeDefined()
    expect(validator.validateSync).toBeDefined()
  })

  describe('#validateSync', () => {
    it('should return true on valid', () => {
      expect(validator.validateSync({ a: 1 })).toEqual(true)
    })

    it('should populate default values on valid', () => {
      const data = {}
      validator.validateSync(data)
      return expect(data).toEqual({ a: 10 })
    })

    it('should return errors when given invalid data', async () => {
      return expect(validator.validateSync({ a: '1' })).toEqual([{
        keyword: 'type',
        dataPath: '.a',
        schemaPath: '#/properties/a/type',
        params: { type: 'number' },
        message: 'should be number'
      }])
    })
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
      expect.assertions(1)
      return expect(validator.validate({ a: '1' })).rejects.toEqual([{
        keyword: 'type',
        dataPath: '.a',
        schemaPath: '#/properties/a/type',
        params: { type: 'number' },
        message: 'should be number'
      }])
    })
  })
})
