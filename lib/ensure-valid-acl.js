'use strict'

const assert = require('assert')

module.exports = (acl) => {
  if (acl) {
    assert(typeof acl === 'function', 'validate must be an async function')
  }
}
