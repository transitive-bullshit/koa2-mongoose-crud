'use strict'

module.exports = function ensureArray (val, defaultValue = [], defaultFn = (v) => v) {
  if (!val) return defaultFn(defaultValue)
  if (Array.isArray(val) && !val.length) return defaultFn(defaultValue)
  if (Array.isArray(val)) return defaultFn(val)
  return defaultFn([val])
}
