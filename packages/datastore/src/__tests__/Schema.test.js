import Schema from '../Schema'

const UserSchema = {
  name: 'user',
  entity: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string' }
    }
  }
}

describe('Schema', () => {
  it('should have interface methods', () => {
    const schema = new Schema(UserSchema)
    expect(schema.schema).toBeDefined()
    expect(schema.name).toBeDefined()
    expect(schema.validate).toBeDefined()
  })
})
