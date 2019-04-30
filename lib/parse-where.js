'use strict'

module.exports = (where = {}) => {
  try {
    if (typeof where === 'string') {
      return JSON.parse(where)
    } else if (typeof where === 'object') {
      return where
    } else {
      throw new Error('invalid where')
    }
  } catch (_) {
    const err = new Error('Querystring `where` parameter must be a valid JSON')
    err.status = 400
    throw err
  }
}
