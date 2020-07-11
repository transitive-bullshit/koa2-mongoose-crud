# koa2-mongoose-crud

> [Koa 2](http://koajs.com/) CRUD middleware for [Mongoose](http://mongoosejs.com/) models.

[![NPM](https://img.shields.io/npm/v/koa2-mongoose-crud.svg)](https://www.npmjs.com/package/koa2-mongoose-crud) [![Build Status](https://travis-ci.com/transitive-bullshit/koa2-mongoose-crud.svg?branch=master)](https://travis-ci.com/transitive-bullshit/koa2-mongoose-crud) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

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

{ // setup basic CRUD REST API for Foo model
  const Router = require('koa-router')
  const router = new Router()

  const model = Foo
  const idParamName = 'foo'

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

* `crud.create = ({ model, label = 'create', acceptsPopulate, defaultPopulate = [], acl } = {})`
* `crud.read = ({ model, idParamName, label = 'read', acceptsPopulate, defaultPopulate = [], acl } = {})`
* `crud.update = ({ model, idParamName, label = 'update', acceptsPopulate, defaultPopulate = [], acl } = {})`
* `crud.delete = ({ model, idParamName, label = 'archive', acl } = {})`

### CRUD++

* `crud.upsert = ({ model, idParamName, updateLabel = 'update', createLabel = 'create', acceptsPopulate, defaultPopulate = [], acl } = {})`
* `crud.index = ({ model, acceptsFilters, canPaginate, defaultFilters, label = 'index', acceptsPopulate, defaultPopulate = [], acl } = {})`
* `crud.count = ({ model, acceptsFilters, acl } = {})`
* `crud.archive = ({ model, idParamName, label = 'archive', acl } = {})`
* `crud.deleteByQuery = ({ model, acceptsFilters, acl } = {})`

### ACLs

You may pass an `acl` parameter (short for Access Control List) to any of the crud functions which has the signature `async function (ctx: Koa.Context, doc: mongoose.Document): Promise`.

For all the methods aside from `create`, `acl` will be passed a mongoose document which matched the crud operation, and you may perform access control to verify, for example, that the currently authenticated user is authorized to perform the crud operation on that document.

For `create`, you can use this to overwrite the document before it's created in Mongo. This is useful, for example, to ensure that the currently authenticated user is stored on a new doocument as it's created for future authorization control.

![](https://media.giphy.com/media/l3V0mgFspVuDAJK9y/giphy.gif)

## License

MIT © [Travis Fischer](https://transitivebullsh.it)

Support my OSS work by <a href="https://twitter.com/transitive_bs">following me on twitter <img src="https://storage.googleapis.com/saasify-assets/twitter-logo.svg" alt="twitter" height="24px" align="center"></a>
