import Datastore from './Datastore'
import assert from 'assert'
import get from 'lodash/get'

export default class TenantAwareDatastrore extends Datastore {
  /**
   * @param {object} config
   * @param {object} config.schema
   * @param {object|function} config.adapter
   * @param {string} [config.tenantIdentifier]
   */
  constructor (config) {
    super(config)
    this.tenantIdentifier = config.tenantIdentifier || 'tenantId'
  }

  getTenantFromOptions (options) {
    return get(options, `meta.${this.tenantIdentifier}`)
  }

  assertTenantInOptions (options) {
    const tenant = this.getTenantFromOptions(options)
    assert.ok(typeof tenant !== 'undefined', `meta.${this.tenantIdentifier} is missing in options`)
  }

  /**
   * This will be required when we want to bypass tenantId restrictions
   * @param {*} options
   */
  shouldIgnoreTenantId (options) {
    return get(options, 'meta.ignoreTenantId', false)
  }

  /**
   *
   * @param {array|object} docs
   * @param {*} options
   */
  ensureTenantOnDoc (docs, options) {
    this.assertTenantInOptions(options)
    const tenant = this.getTenantFromOptions(options)

    if (Array.isArray(docs)) {
      return docs.map(doc => ({
        ...doc,
        [this.tenantIdentifier]: tenant
      }))
    }

    return {
      ...docs,
      [this.tenantIdentifier]: tenant
    }
  }

  ensureTenantOnFilter (filter, options) {
    this.assertTenantInOptions(options)
    const tenant = this.getTenantFromOptions(options)
    return {
      ...filter,
      [this.tenantIdentifier]: tenant
    }
  }

  /**
   *
   * @param {array|object} ids
   * @param {*} options
   */
  async getDocIdsOwnedByTenant (ids, options) {
    this.assertTenantInOptions(options)
    const requestIds = Array.isArray(ids) ? ids : [ids]
    const docs = await this.find({
      $select: 'id',
      id: {
        $in: requestIds
      }
    }, options)

    return docs.map(doc => doc.id)
  }

  async insertOne (doc, options) {
    return super.insertOne(
      this.shouldIgnoreTenantId(options) ? doc : this.ensureTenantOnDoc(doc, options),
      options
    )
  }

  async insertMany (docs, options) {
    return super.insertMany(
      this.shouldIgnoreTenantId(options) ? docs : this.ensureTenantOnDoc(docs, options),
      options
    )
  }

  async updateById (id, update, options) {
    const shouldIgnore = this.shouldIgnoreTenantId(options)
    const ownedIds = shouldIgnore ? [id] : await this.getDocIdsOwnedByTenant(id, options)
    if (ownedIds.length === 0) {
      return false
    }

    return super.updateById(
      ownedIds[0],
      shouldIgnore ? update : this.ensureTenantOnDoc(update, options),
      options
    )
  }

  async updateMany (filter, update, options) {
    const shouldIgnore = this.shouldIgnoreTenantId(options)
    return super.updateById(
      shouldIgnore ? filter : this.ensureTenantOnFilter(filter, options),
      shouldIgnore ? update : this.ensureTenantOnDoc(update, options),
      options
    )
  }

  async deleteById (id, options) {
    const ownedIds = this.shouldIgnoreTenantId(options) ? [id] : await this.getDocIdsOwnedByTenant(id, options)
    if (ownedIds.length === 0) {
      return false
    }

    return super.deleteById(ownedIds[0], options)
  }

  async deleteByIds (ids, options) {
    const ownedIds = this.shouldIgnoreTenantId(options) ? ids : await this.getDocIdsOwnedByTenant(ids, options)
    if (ownedIds.length === 0) {
      return []
    }

    return super.deleteByIds(ownedIds, options)
  }

  async deleteMany (filter, options) {
    return super.deleteMany(
      this.shouldIgnoreTenantId(options) ? filter : this.ensureTenantOnFilter(filter, options),
      options
    )
  }

  async findById (id, options) {
    const ownedIds = this.shouldIgnoreTenantId(options) ? [id] : await this.getDocIdsOwnedByTenant(id, options)
    if (ownedIds.length === 0) {
      return false
    }

    return super.findById(ownedIds[0], options)
  }

  async findByIds (ids, options) {
    const ownedIds = this.shouldIgnoreTenantId(options) ? ids : await this.getDocIdsOwnedByTenant(ids, options)
    if (ownedIds.length === 0) {
      return []
    }

    return super.findByIds(ownedIds, options)
  }

  async findOne (filter, options) {
    return super.findOne(
      this.shouldIgnoreTenantId(options) ? filter : this.ensureTenantOnFilter(filter, options),
      options
    )
  }

  async find (filter, options) {
    return super.find(
      this.shouldIgnoreTenantId(options) ? filter : this.ensureTenantOnFilter(filter, options),
      options
    )
  }

  async count (filter, options) {
    return super.count(
      this.shouldIgnoreTenantId(options) ? filter : this.ensureTenantOnFilter(filter, options),
      options
    )
  }
}
