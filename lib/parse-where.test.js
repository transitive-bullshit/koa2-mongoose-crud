'use strict'

exports.parseWhere = (where) => {
  try {
    return JSON.parse(where)
  } catch (_) {
    const err = new Error('Querystring `where` parameter must be a valid JSON')
    err.status = 400
    throw err
  }
}
