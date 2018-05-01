import insertOneAction from './insertOneActionMixin'
import insertManyAction from './insertManyActionMixin'
import updateByIdAction from './updateByIdActionMixin'
import removeAction from './removeActionMixin'
import getAction from './getActionMixin'
import findAction from './findActionMixin'
import findOneAction from './findOneActionMixin'
import countAction from './countActionMixin'

const restActions = {
  create: insertOneAction,
  update: updateByIdAction,
  remove: removeAction,
  get: getAction,
  find: findAction
}

const extendedActions = {
  insertOne: insertOneAction,
  insertMany: insertManyAction,
  updateById: updateByIdAction,
  deleteById: removeAction,
  deleteByIds: removeAction,
  findById: getAction,
  findByIds: getAction,
  findOne: findOneAction,
  count: countAction
}

/**
 * @param {object} datastore
 * @param {string} [prefix]
 * @param {object} [config]
 * @param {boolean} [config.extended]
 * @param {boolean} [config.disableActions] true => disable actions
 * @param {boolean|string} [config.create] false disable action, user.create => will be action name
 * @param {boolean|string} [config.update] false disable action, user.update => will be action name
 * @param {boolean|string} [config.remove] false disable action, user.remove => will be action name
 * @param {boolean|string} [config.get] false disable action, user.get => will be action name
 * @param {boolean|string} [config.find] false disable action, user.find => will be action name
 * @param {boolean|string} [config.insertOne] false disable action, user.insertone => will be action name
 * @param {boolean|string} [config.insertMany] false disable action, user.insertMany => will be action name
 * @param {boolean|string} [config.updateById] false disable action, user.updateById => will be action name
 * @param {boolean|string} [config.deleteById] false disable action, user.deleteById => will be action name
 * @param {boolean|string} [config.deleteByIds] false disable action, user.deleteByIds => will be action name
 * @param {boolean|string} [config.findById] false disable action, user.findById => will be action name
 * @param {boolean|string} [config.findByIds] false disable action, user.findByIds => will be action name
 * @param {boolean|string} [config.findOne] false disable action, user.findOne => will be action name
 * @param {boolean|string} [config.count] false disable action, user.count => will be action name
 */
const moleculerDatastoreMixin = (
  datastore,
  prefix,
  config
) => {
  const configWithDefaults = Object.assign({
    disableActions: false,
    extended: false
  }, config)

  const availableActions = !config.extended ? restActions : {
    ...restActions,
    extendedActions
  }

  let actions = {}

  // if all actions are not disabled
  if (!configWithDefaults.disableActions) {
    Object.keys(availableActions).forEach((availableActionName) => {
      // if action is not disabled
      if (configWithDefaults[availableActionName] !== false) {
        // use action name if given
        const actionName = configWithDefaults[availableActionName] || availableActionName
        const actionNameWithPrefix = prefix ? `${prefix}.${actionName}` : actionName
        actions[actionNameWithPrefix] = availableActions[availableActionName](actionName)
      }
    })
  }

  return {
    actions,
    methods: {
      getDatastore () {
        return datastore
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
    }
  }
}

export default moleculerDatastoreMixin
