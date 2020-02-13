const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const uuid = require('uuid')

exports.auth = (data) => {
  const { token } = data

}

/**
 * data: object
 * send: function(data: object, send: function)
 *
 * return falsey value to terminate the request
 **/
exports.create = (data, send) => {
  const { username, password } = data
  if (!username || username.length < 4) {
    send('Username must be at least 4 characters', 1)
    return
  }
  if (!password || password.length < 6) {
    send('Password must be at least 6 characters', 1)
    return
  }
  // Create a user in redis
  send({
    username,
    idv0: uuid.v4(),
  })
}
