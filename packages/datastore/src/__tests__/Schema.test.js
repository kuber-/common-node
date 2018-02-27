import Schema from '../Schema'

const UserSchema = {
  name: 'user',
  entity: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      email: { type: 'string' }
    }
  },
  validators: {
    onUpdate: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' }
      }
    }
  }
}

const UserSchemaWithOnCreate = {
  name: 'user',
  entity: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string' }
    }
  },
  validators: {
    onCreate: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string' }
      }
    }
  }
}

describe('Schema', () => {
  let schema = null

  beforeEach(() => {
    schema = new Schema(UserSchema)
  })

  it('should have interface methods', () => {
    expect(schema.schema).toBeDefined()
    expect(schema.name).toBeDefined()
    expect(schema.validate).toBeDefined()
  })

  it('should have private methods', () => {
    expect(schema.internalCreateError).toBeDefined()
  })

  describe('#internalCreateError', () => {
    it('should return error object', () => {
      const error = schema.internalCreateError([])
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Parameters validation error!')
      expect(error.code).toBe(422)
      expect(error.type).toBe('validation_error')
      expect(error.data).toEqual([])
    })
  })

  describe('#validate', () => {
    it('should resolve to data when valid', () => {
      return expect(schema.validate({ name: 'name', email: 'email' })).resolves.toEqual({ name: 'name', email: 'email' })
    })

    it('should reject to error when in valid', () => {
      expect.assertions(4)
      return schema.validate({ name: 1, email: 'email' }).catch((err) => {
        expect(err.message).toBe('Parameters validation error!')
        expect(err.code).toBe(422)
        expect(err.type).toBe('validation_error')
        expect(err.data).toEqual([{
          keyword: 'type',
          dataPath: '.name',
          schemaPath: '#/properties/name/type',
          params: { type: 'string' },
          message: 'should be string'
        }])
      })
    })

    it('should use entity schema by default', () => {
      expect.assertions(4)
      return schema.validate({ email: 'email' }).catch((err) => {
        expect(err.message).toBe('Parameters validation error!')
        expect(err.code).toBe(422)
        expect(err.type).toBe('validation_error')
        expect(err.data).toEqual([{
          keyword: 'required',
          dataPath: '',
          schemaPath: '#/required',
          params: { missingProperty: 'name' },
          message: 'should have required property \'name\''
        }])
      })
    })

    it('should use onCreate schema if exists by default', () => {
      const schemaWithOnCreate = new Schema(UserSchemaWithOnCreate)
      expect.assertions(4)
      return schemaWithOnCreate.validate({ email: 'email' }).catch((err) => {
        expect(err.message).toBe('Parameters validation error!')
        expect(err.code).toBe(422)
        expect(err.type).toBe('validation_error')
        expect(err.data).toEqual([{
          keyword: 'required',
          dataPath: '',
          schemaPath: '#/required',
          params: { missingProperty: 'name' },
          message: 'should have required property \'name\''
        }])
      })
    })

    it('should use onUpdate schema when onUpdate = true', () => {
      return expect(schema.validate({ email: 'email' }, true)).resolves.toEqual({ email: 'email' })
    })
  })
})
