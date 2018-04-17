# koa2-mongoose-crud

> [Koa 2](http://koajs.com/) CRUD middleware for [Mongoose](http://mongoosejs.com/) models.

[![NPM](https://img.shields.io/npm/v/koa2-mongoose-crud.svg)](https://www.npmjs.com/package/koa2-mongoose-crud) [![Build Status](https://travis-ci.org/transitive-bullshit/koa2-mongoose-crud.svg?branch=master)](https://travis-ci.org/transitive-bullshit/koa2-mongoose-crud) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Installation

```
npm install --save koa2-mongoose-crud
```

This module uses async await and therefore requires node >= 8.

## Usage

```js
const crud = require('koa2-mongoose-crud')
const mongoose = require('mongoose')

// setup minimal koa application
const Koa = require('koa')
const app = new Koa()

// setup basic mongoose model
const fooSchema = mongoose.Schema({
  name: String
})
const Foo = mongoose.model('Foo', fooSchema)

const model = Foo
const idParamName = 'foo'

{ // setup basic CRUD REST API for Foo model
  const Router = require('koa-router')
  const router = new Router()

  router.get('/foo/:foo', crud.read({ model, idParamName }))
  router.post('/foo', crud.create({ model, idParamName }))
  router.put('/foo/:foo', crud.update({ model, idParamName }))
  router.del('/foo/:foo', crud.delete({ model, idParamName }))

  app.use(router.middleware())
}

app.listen(3000)
```

Note that any model used with `koa2-mongoose-crud` must implement `model.getSafePaths(label, ctx)` and `model.getPublicDocument(doc, safePaths)` for basic filtering of readable / writable properties on different operations where label can be something like `create`, `read`, `update`, or `delete`.

## API

### CRUD

* `crud.create = ({ model, label = 'create', acceptsPopulate, defaultPopulate = [] } = {})`
* `crud.read = ({ model, idParamName, label = 'read', acceptsPopulate, defaultPopulate = [] } = {})`
* `crud.update = ({ model, idParamName, label = 'update', acceptsPopulate, defaultPopulate = [] } = {})`
* `crud.delete = ({ model, idParamName, label = 'archive' } = {})`

### CRUD++

* `crud.upsert = ({ model, idParamName, updateLabel = 'update', createLabel = 'create', acceptsPopulate, defaultPopulate = [] } = {})`
* `crud.index = ({ model, acceptsFilters, canPaginate, defaultFilters, label = 'index', acceptsPopulate, defaultPopulate = [] } = {})`
* `crud.count = ({ model, acceptsFilters } = {})`
* `crud.archive = ({ model, idParamName, label = 'archive' } = {})`
* `crud.deleteByQuery = ({ model, acceptsFilters } = {})`

![](https://media.giphy.com/media/l3V0mgFspVuDAJK9y/giphy.gif)

## License

MIT © [Travis Fischer](https://github.com/transitive-bullshit)
