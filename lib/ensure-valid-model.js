'use strict'

const assert = require('assert')

module.exports = (model) => {
  assert(model, 'model is required')
  assert(model.getSafePaths, `Please define ${model.modelName}.getSafePaths(label, ctx)`)
  assert(model.getPublicDocument, `Please define ${model.modelName}.getPublicDocument(doc, safePaths)`)
}
