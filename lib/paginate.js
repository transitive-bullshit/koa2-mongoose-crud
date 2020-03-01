module.exports = function paginate (query, opts) {
  const limit = parseInt(opts.limit) || 10
  const offset = parseInt(opts.offset) || 0
  const sort = opts.sort

  query.limit(limit)
  query.offset(offset)

  if (sort) {
    query.sort(sort)
  }
}
