import insertOneAction from './insertOneActionMixin'
import insertManyAction from './insertManyActionMixin'
import updateByIdAction from './updateByIdActionMixin'
import removeAction from './removeActionMixin'
import getAction from './getActionMixin'
import findAction from './findActionMixin'
import findOneAction from './findOneActionMixin'
import countAction from './countActionMixin'

const availableActions = {
  create: insertOneAction,
  insert: insertManyAction,
  update: updateByIdAction,
  remove: removeAction,
  get: getAction,
  insertOne: insertOneAction,
  insertMany: insertManyAction,
  updateById: updateByIdAction,
  deleteById: removeAction,
  deleteByIds: removeAction,
  findById: getAction,
  findByIds: getAction,
  find: findAction,
  findOne: findOneAction,
  count: countAction
}

/**
 * @param {object} [config]
 * @param {boolean} [config.disableActions] true => disable actions
 * @param {boolean|string} config.create false disable action, user.create => will be action name
 * @param {boolean|string} config.insert false disable action, user.insert => will be action name
 * @param {boolean|string} config.update false disable action, user.update => will be action name
 * @param {boolean|string} config.remove false disable action, user.remove => will be action name
 * @param {boolean|string} config.get false disable action, user.get => will be action name
 * @param {boolean|string} config.find false disable action, user.find => will be action name
 */
const moleculerDatastoreMixin = (config) => {
  const configWithDefaults = Object.assign({
    disableActions: false
  }, config)

  let actions = {}

  // if all actions are not disabled
  if (!configWithDefaults.disableActions) {
    Object.keys(availableActions).forEach((availableActionName) => {
      // if action is not disabled
      if (configWithDefaults[availableActionName] !== false) {
        // use action name if given
        const actionName = configWithDefaults[availableActionName] || availableActionName
        actions[actionName] = availableActions[availableActionName](actionName)
      }
    })
  }

  return {
    actions,
    methods: {
      getDatastore () {
        return this.datastore
      },

      async invokeDatastoreMethod (method, ctx, ...rest) {
        const datastore = this.getDatastore()
        const options = rest.pop()
        const mergedOptions = Object.assign({
          meta: ctx.meta
        }, options)
        return datastore[method](...rest, mergedOptions)
      },

      async insertOne (ctx, entity, options) {
        return this.invokeDatastoreMethod('insertOne', ctx, entity, options)
      },

      async insertMany (ctx, entities, options) {
        return this.invokeDatastoreMethod('insertMany', ctx, entities, options)
      },

      async updateById (ctx, id, update, options) {
        return this.invokeDatastoreMethod('updateById', ctx, id, update, options)
      },

      async updateMany (ctx, filter, update, options) {
        return this.invokeDatastoreMethod('updateMany', ctx, filter, update, options)
      },

      async deleteById (ctx, id, options) {
        return this.invokeDatastoreMethod('deleteById', ctx, id, options)
      },

      async deleteByIds (ctx, ids, options) {
        return this.invokeDatastoreMethod('deleteByIds', ctx, ids, options)
      },

      async deleteMany (ctx, filter, options) {
        return this.invokeDatastoreMethod('deleteMany', ctx, filter, options)
      },

      async findById (ctx, id, options) {
        return this.invokeDatastoreMethod('findById', ctx, id, options)
      },

      async findByIds (ctx, ids, options) {
        return this.invokeDatastoreMethod('findByIds', ctx, ids, options)
      },

      async findOne (ctx, filter, options) {
        return this.invokeDatastoreMethod('findOne', ctx, filter, options)
      },

      async find (ctx, filter, options) {
        return this.invokeDatastoreMethod('find', ctx, filter, options)
      },

      async count (ctx, filter, options) {
        return this.invokeDatastoreMethod('count', ctx, filter, options)
      }
    },
    created () {
      if (!this.schema.datastore) {
        throw new Error('datastore is missing in service schema')
      }

      this.datastore = this.schema.datastore
    }
  }
}

export default moleculerDatastoreMixin
