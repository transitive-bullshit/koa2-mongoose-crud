'use strict'

module.exports = (model, doc, fields) => {
  if (fields && fields.length) {
    return Promise.all(fields.map(field => model.populate(doc, field)))
  }
}
