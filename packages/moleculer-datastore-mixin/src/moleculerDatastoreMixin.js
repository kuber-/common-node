import createAction from './createActionMixin'
import insertAction from './insertActionMixin'
import updateAction from './updateActionMixin'
import removeAction from './removeActionMixin'
import getAction from './getActionMixin'
import findAction from './findActionMixin'

/**
 * @param {Object} config
 */
const moleculerDatastoreMixin = (config = {}) => {
  const create = createAction()
  const insert = insertAction()
  const update = updateAction()
  const remove = removeAction()
  const get = getAction()
  const find = findAction()

  return {
    actions: {
      [create.actionName]: create,
      [insert.actionName]: insert,
      [update.actionName]: update,
      [remove.actionName]: remove,
      [get.actionName]: get,
      [find.actionName]: find
    },
    methods: {
      getAdapter () {
        return this.adapter
      },

      async invokeAdapterMethod (method, ctx, ...rest) {
        const adapter = this.getAdapter()
        const options = rest.pop()
        const mergedOptions = Object.assign({}, ctx.meta, options)
        return adapter[method](...rest, mergedOptions)
      },

      async insertOne (ctx, entity, options) {
        return this.invokeAdapterMethod('insertOne', ctx, entity, options)
      },

      async insertMany (ctx, entities, options) {
        return this.invokeAdapterMethod('insertMany', ctx, entities, options)
      },

      async updateById (ctx, id, update, options) {
        return this.invokeAdapterMethod('updateById', ctx, id, update, options)
      },

      async updateMany (ctx, filter, update, options) {
        return this.invokeAdapterMethod('updateMany', ctx, filter, update, options)
      },

      async deleteById (ctx, id, options) {
        return this.invokeAdapterMethod('deleteById', ctx, id, options)
      },

      async deleteByIds (ctx, ids, options) {
        return this.invokeAdapterMethod('deleteByIds', ctx, ids, options)
      },

      async deleteMany (ctx, filter, options) {
        return this.invokeAdapterMethod('deleteMany', ctx, filter, options)
      },

      async findById (ctx, id, options) {
        return this.invokeAdapterMethod('findById', ctx, id, options)
      },

      async findByIds (ctx, ids, options) {
        return this.invokeAdapterMethod('findByIds', ctx, ids, options)
      },

      async findOne (ctx, filter, options) {
        return this.invokeAdapterMethod('findOne', ctx, filter, options)
      },

      async find (ctx, filter, options) {
        return this.invokeAdapterMethod('find', ctx, filter, options)
      },

      async count (ctx, filter, options) {
        return this.invokeAdapterMethod('count', ctx, filter, options)
      }
    },
    created () {
      if (!this.schema.adapter) {
        throw new Error('adapter is missing in service schema')
      }

      this.adapter = this.schema.adapter
    }
  }
}

export default moleculerDatastoreMixin
