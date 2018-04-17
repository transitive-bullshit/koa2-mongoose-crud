'use strict'

const ensureArray = require('./ensure-array')

module.exports = (...arrays) => {
  const normalizedArrays = arrays.map((array) => ensureArray(array, []))
  const mergedArrays = [].concat(...normalizedArrays)
  return [...new Set([...mergedArrays])]
}
