'use strict'

const mergeArrayUnique = require('./merge-array-unique')

module.exports = (model, doc, ...args) => {
  if (args && args.length) {
    const fields = mergeArrayUnique(args.filter(Boolean))

    if (fields.length) {
      return Promise.all(fields.map(field => model.populate(doc, field)))
    }
  }

  return Promise.resolve()
}
