'use strict'

exports.populate = async (ctx, doc, { model, populate }) => {
  if (populate && populate.length && ctx.query.populate) {
    await Promise.all(populate.map(field => model.populate(doc, field)))
  }
}
