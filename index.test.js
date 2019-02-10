'use strict'

const crud = require('.')
const assert = require('chai').assert
const sinon = require('sinon')

describe('koa2-mongoose-crud', () => {
  const sandbox = sinon.sandbox.create()

  const getCtx = (obj) => Object.assign({
    query: {},
    params: { id: 'id' },
    throw: sandbox.stub().throws({ fakeError: true }),
    assert: sandbox.stub()
  }, obj)

  const getQuery = () => ({
    find: sandbox.stub(),
    populate: sandbox.stub(),
    limit: sandbox.stub(),
    sort: sandbox.stub(),
    where: sandbox.stub(),
    exec: sandbox.stub().callsFake(() => Promise.resolve('exec')),
    cursor: sandbox.stub().callsFake(() => ({
      on: sandbox.stub().callsFake(() => ({
        pipe: sandbox.stub().callsFake(() => ({
          pipe: sandbox.stub()
        }))
      }))
    }))
  })

  const getModel = (query) => ({
    schema: { methods: {} },
    modelName: 'Testmodel',
    find: sandbox.stub().callsFake(() => query),
    findById: sandbox.stub().callsFake(() => query),
    findByIdAndUpdate: sandbox.stub().callsFake(() => query),
    findOneAndUpdate: sandbox.stub().callsFake(() => query),
    where: sandbox.stub().callsFake(() => query),
    populate: sandbox.stub(),
    create: sandbox.stub().callsFake(() => Promise.resolve('created-doc')),
    safeUpdate: sandbox.stub().callsFake(() => 'updated-doc'),
    getSafePaths: sandbox.stub().callsFake(() => 'getSafePaths'),
    getPublicDocument: sandbox.stub().callsFake(() => 'getPublicDocument'),
    remove: sandbox.stub().callsFake(() => ({
      exec: sandbox.stub().callsFake(() => Promise.resolve({ result: { n: 10 } }))
    })),
    count: sandbox.stub().callsFake(() => query)
  })

  before(() => {
    sandbox.stub(crud, 'parse')
    sandbox.stub(crud, 'paginate')
    sandbox.stub(crud, 'through2')
    sandbox.stub(crud, 'filter')
    sandbox.stub(crud, 'flatten')
    sandbox.stub(crud, 'populate')
  })

  afterEach(() => sandbox.reset())
  after(() => sandbox.restore())

  describe('#index()', () => {
    it('should throw if not passing model', () => {
      assert.throw(() => crud.index(), /model/)
    })

    it('should throw if getPublicDocument is not defined in model', () => {
      const model = getModel({})
      model._getPublicDocument = model.getPublicDocument
      model.getPublicDocument = null
      assert.throw(() => crud.index({ model }), /getPublicDocument/)
      model.getPublicDocument = model._getPublicDocument
    })

    it('should succeed', async () => {
      const ctx = getCtx({
        query: {
          limit: 1,
          sort: '-bar',
          where: JSON.stringify({ foo: 'bar' }),
          populate: ['1', '3']
        }
      })

      const query = getQuery()
      const model = getModel(query)

      const opts = {
        model,
        acceptsFilters: true,
        acceptsPagination: true,
        acceptsPopulate: true,
        defaultFilters: { bar: 'foo' },
        defaultPopulate: ['1', '2'],
        label: 'safe-path-label'
      }

      crud.through2.callsFake((fn) => fn('doc', 'enc', () => {}))
      crud.populate.callsFake(() => Promise.resolve())

      await crud.index(opts)(ctx)

      assert.deepEqual(model.find.args[0], [{ foo: 'bar', bar: 'foo' }])
      assert.deepEqual(model.getSafePaths.args[0], ['safe-path-label', ctx])
      assert.deepEqual(crud.paginate.args[0], [query, ctx.query])
      assert.deepEqual(crud.populate.args[0], [model, 'doc', ['1', '3', '2']])
      assert.deepEqual(model.getPublicDocument.args[0], ['doc', 'getSafePaths'])
    })

    it('should fail if qs.where is not a valid JSON', async () => {
      const ctx = getCtx({
        query: {
          where: 'something{wrong'
        }
      })

      await crud.index({
        model: getModel(getQuery()),
        acceptsFilters: true
      })(ctx).then(() => {
        throw new Error('this should not be thrown')
      }).catch((err) => {
        assert.equal(err.status, 400)
        assert.match(err.message, /JSON/)
      })
    })
  })

  describe('#count()', () => {
    it('should throw if not passing model', () => {
      assert.throw(() => crud.count(), /model/)
    })

    it('should succeed', async () => {
      const ctx = getCtx({
        query: {
          limit: 1,
          sort: '-bar',
          where: JSON.stringify({ foo: 'foo' })
        }
      })

      const model = getModel(getQuery())

      await crud.count({
        model,
        acceptsFilters: true,
        defaultFilters: { bar: 'bar' }
      })(ctx)

      assert.deepEqual(model.count.args[0], [{ foo: 'foo', bar: 'bar' }])
      assert.deepEqual(ctx.body.where, { foo: 'foo', bar: 'bar' })
      assert.deepEqual(ctx.body.count, 'exec')
    })
  })

  describe('#create()', () => {
    it('should throw if not passing model', () => {
      assert.throw(() => crud.create(), /model/)
    })

    it('should throw if getPublicDocument is not defined in model', () => {
      const model = getModel(getQuery())
      model._getPublicDocument = model.getPublicDocument
      model.getPublicDocument = null
      assert.throw(() => crud.create({ model }), /getPublicDocument/)
      model.getPublicDocument = model._getPublicDocument
    })

    it('should succeed', async () => {
      const ctx = getCtx({
        query: {
          populate: ['a', 'c']
        }
      })

      const query = getQuery()
      const model = getModel(query)

      crud.parse.callsFake(() => ({ name: 'fake-post' }))
      crud.filter.callsFake(() => 'safe-data')

      await crud.create({
        model,
        acceptsPopulate: true,
        defaultPopulate: ['a', 'b'],
        label: 'label-create'
      })(ctx)

      assert.deepEqual(crud.parse.args[0], [ctx])
      assert.deepEqual(model.getSafePaths.args[0], ['label-create', ctx])
      assert.deepEqual(crud.filter.args[0], [{ name: 'fake-post' }, 'getSafePaths'])
      assert.deepEqual(model.create.args[0], ['safe-data'])
      assert.deepEqual(crud.populate.args[0], [model, 'created-doc', ['a', 'c', 'b']])
      assert.deepEqual(model.getSafePaths.args[1], ['read', ctx])
      assert.deepEqual(model.getPublicDocument.args[0], ['created-doc', 'getSafePaths'])
    })
  })

  describe('#read()', () => {
    it('should throw if not passing model', () => {
      assert.throw(() => crud.read(), /model/)
    })

    it('should throw if not passing idParamName', () => {
      const model = getModel(getQuery())
      assert.throw(() => crud.read({ model }), /idParamName/)
    })

    it('should throw if getPublicDocument is not defined in model', () => {
      const model = getModel(getQuery())
      model._getPublicDocument = model.getPublicDocument
      model.getPublicDocument = null
      assert.throw(() => crud.read({ model }), /getPublicDocument/)
      model.getPublicDocument = model._getPublicDocument
    })

    it('should succeed', async () => {
      const ctx = getCtx({
        params: {
          foo: 'object-id'
        },
        query: {
          populate: ['a']
        }
      })

      const query = getQuery()
      const model = getModel(query)

      query.exec.callsFake(() => 'found-doc')

      await crud.read({
        model,
        idParamName: 'foo',
        acceptsPopulate: true,
        defaultPopulate: ['b', 'c'],
        label: 'label-read'
      })(ctx)

      assert.deepEqual(model.findById.args[0], ['object-id'])
      assert.deepEqual(ctx.assert.args[0], ['found-doc', 404, 'Testmodel not found [object-id]'])
      assert.deepEqual(crud.populate.args[0], [model, 'found-doc', ['a', 'b', 'c']])
      assert.deepEqual(model.getSafePaths.args[0], ['label-read', ctx])
      assert.deepEqual(model.getPublicDocument.args[0], ['found-doc', 'getSafePaths'])
      assert.deepEqual(ctx.body, 'getPublicDocument')
    })
  })

  describe('#update()', () => {
    it('should throw if not passing model', () => {
      assert.throw(() => crud.update(), /model/)
    })

    it('should throw if not passing idParamName', () => {
      const model = getModel(getQuery())
      assert.throw(() => crud.update({ model }), /idParamName/)
    })

    it('should throw if getPublicDocument is not defined in model', () => {
      const model = getModel(getQuery())
      model._getPublicDocument = model.getPublicDocument
      model.getPublicDocument = null
      assert.throw(() => crud.update({ model }), /getPublicDocument/)
      model.getPublicDocument = model._getPublicDocument
    })

    it('should succeed', async () => {
      const ctx = getCtx({
        params: {
          foo: 'object-id'
        },
        query: {
          populate: ['a']
        }
      })

      const query = getQuery()
      const model = getModel(query)

      const opts = {
        model,
        idParamName: 'foo',
        acceptsPopulate: true,
        defaultPopulate: ['b', 'c'],
        label: 'label-update'
      }

      query.exec.callsFake(() => 'doc')
      crud.parse.callsFake(() => ({ name: 'fake-post' }))
      crud.filter.callsFake(() => 'safe-data')

      await crud.update(opts)(ctx)

      assert.deepEqual(ctx.assert.args[0], ['doc', 404, 'Testmodel not found [object-id]'])
      assert.deepEqual(model.getSafePaths.args[0], ['label-update', ctx])
      assert.deepEqual(crud.filter.args[0], [{ name: 'fake-post' }, 'getSafePaths'])
      assert.deepEqual(model.findByIdAndUpdate.args[0], [
        'object-id',
        'safe-data',
        { runValidators: true }
      ])
      assert.deepEqual(crud.populate.args[0], [model, 'doc', ['a', 'b', 'c']])
      assert.deepEqual(model.getSafePaths.args[1], ['label-update', ctx])
      assert.deepEqual(model.getPublicDocument.args[0], ['doc', 'getSafePaths'])
    })
  })

  describe('#archive()', () => {
    it('should throw if not passing model', () => {
      assert.throw(() => crud.archive(), /model/)
    })

    it('should throw if not passing idParamName', () => {
      const model = getModel(getQuery())
      assert.throw(() => crud.archive({ model }), /idParamName/)
    })

    it('should archive document', async () => {
      const ctx = getCtx({
        params: {
          foo: 'object-id'
        },
        query: {
          populate: ['a']
        }
      })

      const query = getQuery()
      const model = getModel(query)

      query.exec.callsFake(() => 'doc')
      crud.parse.callsFake(() => ({ name: 'fake-post' }))
      crud.filter.callsFake(() => 'safe-data')

      await crud.archive({
        model,
        idParamName: 'foo',
        acceptsPopulate: true,
        defaultPopulate: ['b', 'c'],
        label: 'label-archive'
      })(ctx)

      assert.deepEqual(model.findByIdAndUpdate.args[0], ['object-id', { archived: true }])
      assert.deepEqual(ctx.assert.args[0], ['doc', 404, 'Testmodel not found [object-id]'])
      assert.deepEqual(crud.populate.args[0], [model, 'doc', ['a', 'b', 'c']])
      assert.deepEqual(model.getSafePaths.args[0], ['label-archive', ctx])
      assert.deepEqual(model.getPublicDocument.args[0], ['doc', 'getSafePaths'])
    })
  })

  describe('#deleteByQuery()', () => {
    it('should throw if not passing model', () => {
      assert.throw(() => crud.deleteByQuery(), /model/)
    })

    it('should succeed', async () => {
      const ctx = getCtx({
        query: {
          where: JSON.stringify({ foo: 'bar' })
        }
      })

      const query = getQuery()
      const model = getModel(query)

      query.exec.callsFake(() => 10)

      await crud.deleteByQuery({
        model,
        acceptsFilters: true
      })(ctx)

      assert.deepEqual(model.remove.args[0], [{ foo: 'bar' }])
      assert.deepEqual(ctx.assert.args[0][0], 1)
      assert.deepEqual(ctx.assert.args[0][1], 400)
      assert.deepEqual(ctx.body.where, { foo: 'bar' })
      assert.deepEqual(ctx.body.deleted, 10)
    })
  })
})
