'use strict'

const assert = require('assert')
const stringify = require('json-array-stream')

const ensureValidModel = require('./lib/ensure-valid-model')
const ensureValidAcl = require('./lib/ensure-valid-acl')
const mergeArrayUnique = require('./lib/merge-array-unique')

exports.filter = require('filter-object')
exports.flatten = require('flat')
exports.paginate = require('mongoose-range-paginate')
exports.parse = require('co-body')
exports.through2 = require('through2').obj

exports.parseWhere = require('./lib/parse-where')
exports.populate = require('./lib/populate')

exports.create = (args = {}) => {
  const {
    model,
    acceptsPopulate,
    defaultPopulate = [],
    acl,
    label = 'create'
  } = args

  ensureValidModel(model)
  ensureValidAcl(acl)

  return async function create (ctx) {
    const data = await exports.parse(ctx)
    const safePathsForCreate = model.getSafePaths(label, ctx)
    const safeData = exports.filter(data, safePathsForCreate)
    if (acl) { await acl(ctx, safeData) }
    const doc = await model.create(safeData)

    const populate = acceptsPopulate
      ? mergeArrayUnique(ctx.query.populate, defaultPopulate)
      : mergeArrayUnique(defaultPopulate)

    await exports.populate(model, doc, populate)

    const safePathsForRead = model.getSafePaths('read', ctx)
    ctx.body = model.getPublicDocument(doc, safePathsForRead)
    return model
  }
}

exports.read = (args = {}) => {
  const {
    model,
    idParamName,
    acceptsPopulate,
    defaultPopulate = [],
    acl,
    label = 'read'
  } = args

  ensureValidModel(model)
  ensureValidAcl(acl)
  assert(idParamName, 'idParamName is required')

  return async function read (ctx) {
    const { [idParamName]: id } = ctx.params

    const doc = await model.findById(id).exec()
    ctx.assert(doc, 404, `${model.modelName} not found [${id}]`)
    if (acl) await acl(ctx, doc)

    const populate = acceptsPopulate
      ? (ctx.query.populate === false || ctx.query.populate === 'false'
        ? []
        : mergeArrayUnique(ctx.query.populate, defaultPopulate))
      : mergeArrayUnique(defaultPopulate)

    await exports.populate(model, doc, populate)

    const safePaths = model.getSafePaths(label, ctx)
    ctx.body = model.getPublicDocument(doc, safePaths)
    return model
  }
}

exports.update = (args = {}) => {
  const {
    model,
    idParamName,
    acceptsPopulate,
    defaultPopulate = [],
    acl,
    label = 'update'
  } = args

  ensureValidModel(model)
  ensureValidAcl(acl)
  assert(idParamName, 'idParamName is required')

  return async function update (ctx) {
    const { [idParamName]: id } = ctx.params

    if (acl) {
      const doc = await model.findById(id)
      ctx.assert(doc, 404, `${model.modelName} not found [${id}]`)
      await acl(ctx, doc)
    }

    const data = await exports.parse(ctx)
    const safePathsForUpdate = model.getSafePaths(label, ctx)
    const safeData = exports.filter(data, safePathsForUpdate)
    const doc = await model.findByIdAndUpdate(id, safeData, {
      runValidators: true
    }).exec()
    ctx.assert(doc, 404, `${model.modelName} not found [${id}]`)

    const populate = acceptsPopulate
      ? mergeArrayUnique(ctx.query.populate, defaultPopulate)
      : mergeArrayUnique(defaultPopulate)

    await exports.populate(model, doc, populate)

    const safePathsForRead = model.getSafePaths(label, ctx)
    ctx.body = model.getPublicDocument(doc, safePathsForRead)
    return model
  }
}

exports.delete = (args = {}) => {
  const {
    model,
    idParamName,
    acceptsPopulate,
    defaultPopulate = [],
    acl,
    label = 'delete'
  } = args

  ensureValidModel(model)
  ensureValidAcl(acl)
  assert(idParamName, 'idParamName is required')

  return async function deleteAll (ctx) {
    const { [idParamName]: id } = ctx.params

    if (acl) {
      const doc = await model.findById(id)
      ctx.assert(doc, 404, `${model.modelName} not found [${id}]`)
      await acl(ctx, doc)
    }

    const doc = await model.findByIdAndRemove(id).exec()
    ctx.assert(doc, 404, `${model.modelName} not found [${id}]`)

    const populate = acceptsPopulate
      ? mergeArrayUnique(ctx.query.populate, defaultPopulate)
      : mergeArrayUnique(defaultPopulate)

    await exports.populate(model, doc, populate)

    const safePathsForRead = model.getSafePaths(label, ctx)
    ctx.body = model.getPublicDocument(doc, safePathsForRead)
    return model
  }
}

exports.upsert = (args = {}) => {
  const {
    model,
    acceptsPopulate,
    idParamName,
    defaultPopulate = [],
    acl,
    createLabel = 'create',
    updateLabel = 'update'
  } = args

  ensureValidModel(model)
  ensureValidAcl(acl)
  assert(idParamName, 'idParamName is required')

  return async function upsert (ctx) {
    const data = await exports.parse(ctx)
    const id = ctx.params[idParamName] || data._id
    let doc

    if (id) {
      if (acl) {
        const doc = await model.findById(id)
        ctx.assert(doc, 404, `${model.modelName} not found [${id}]`)
        await acl(ctx, doc)
      }

      const safePathsForUpdate = model.getSafePaths(updateLabel, ctx)
      const safeData = exports.filter(data, safePathsForUpdate)
      doc = await model.findByIdAndUpdate(id, safeData, {
        new: true,
        runValidators: true
      }).exec()
      ctx.assert(doc, 404, `${model.modelName} not found [${id}]`)
    } else {
      const safePathsForCreate = model.getSafePaths(createLabel, ctx)
      const safeData = exports.filter(data, safePathsForCreate)
      doc = await model.create(safeData)
    }

    const populate = acceptsPopulate
      ? mergeArrayUnique(ctx.query.populate, defaultPopulate)
      : mergeArrayUnique(defaultPopulate)

    await exports.populate(model, doc, populate)

    const safePathsForRead = model.getSafePaths('read', ctx)
    ctx.body = model.getPublicDocument(doc, safePathsForRead)
    return model
  }
}

exports.index = (args = {}) => {
  const {
    model,
    acceptsFilters,
    acceptsPopulate,
    acceptsPagination,
    defaultPopulate = [],
    defaultFilters = {},
    acl,
    label = 'index'
  } = args

  ensureValidModel(model)
  ensureValidAcl(acl)

  return async function index (ctx) {
    const where = acceptsFilters
      ? Object.assign({}, exports.parseWhere(ctx.query.where), defaultFilters)
      : defaultFilters

    const query = model.find(where)

    if (model.collation) {
      query.collation(model.collation)
    }

    if (acceptsPagination && ctx.query !== undefined) {
      exports.paginate(query, ctx.query)
    }

    const populate = acceptsPopulate
      ? mergeArrayUnique(ctx.query.populate, defaultPopulate)
      : mergeArrayUnique(defaultPopulate)

    const safePaths = model.getSafePaths(label, ctx)

    ctx.type = 'json'
    ctx.body = query.cursor(query.options)
      .on('error', (err) => {
        ctx.status = 500
        ctx.body.end()

        throw err
      })
      .pipe(exports.through2((doc, enc, done) => {
        const populateImpl = () => {
          exports.populate(model, doc, populate)
            .then(() => done(null, model.getPublicDocument(doc, safePaths)))
            .catch(done)
        }

        if (acl) {
          acl(ctx, doc)
            .then(populateImpl)
            .catch(done)
        } else {
          populateImpl()
        }
      }))
      .pipe(stringify())
  }
}

exports.count = (args = {}) => {
  const {
    model,
    acceptsFilters,
    defaultFilters = {}
  } = args

  ensureValidModel(model)

  return async function count (ctx) {
    const where = acceptsFilters
      ? Object.assign({}, exports.parseWhere(ctx.query.where), defaultFilters)
      : defaultFilters

    ctx.body = {
      where,
      count: await model.count(where).exec()
    }
  }
}

exports.archive = (args = {}) => {
  const {
    model,
    idParamName,
    acceptsPopulate,
    defaultPopulate = [],
    acl,
    label = 'archive'
  } = args

  ensureValidModel(model)
  ensureValidAcl(acl)
  assert(idParamName, 'idParamName is required')

  return async function archive (ctx) {
    const { [idParamName]: id } = ctx.params

    if (acl) {
      const doc = await model.findById(id)
      ctx.assert(doc, 404, `${model.modelName} not found [${id}]`)
      await acl(ctx, doc)
    }

    const doc = await model.findByIdAndUpdate(id, { archived: true }).exec()
    ctx.assert(doc, 404, `${model.modelName} not found [${id}]`)

    const populate = acceptsPopulate
      ? mergeArrayUnique(ctx.query.populate, defaultPopulate)
      : mergeArrayUnique(defaultPopulate)

    await exports.populate(model, doc, populate)

    const safePathsForRead = model.getSafePaths(label, ctx)
    ctx.body = model.getPublicDocument(doc, safePathsForRead)
    return model
  }
}

exports.deleteByQuery = (args = {}) => {
  const {
    model,
    acceptsFilters,
    defaultFilters = {},
    acl
  } = args

  ensureValidModel(model)
  ensureValidAcl(acl)

  return async function deleteByQuery (ctx) {
    const where = acceptsFilters
      ? Object.assign({}, exports.parseWhere(ctx.query.where), defaultFilters)
      : defaultFilters

    ctx.assert(Object.keys(where).length, 400, 'Querystring `where` parameter must not be empty')

    if (acl) {
      const docs = await model.find(where)
      for (const doc of docs) {
        await acl(ctx, doc)
      }
    }

    const { result } = await model.remove(where).exec()

    ctx.body = {
      where,
      deleted: result.n
    }
  }
}
