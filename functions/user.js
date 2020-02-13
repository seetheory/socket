const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const uuid = require('uuid')
const { connect, p } = require('./db')

function parseAuth(token) {
  if (!token) throw new Error('No token in request')
  const user = jwt.verify(token, process.env.WEB_TOKEN_SECRET)
  return user
}

/**
 * data: object
 * send: function(message: string|object, data?: object, status?: number)
 **/
exports.create = async (data, send) => {
  const { username, password } = data
  if (!username || username.length < 4) {
    send('Username must be at least 4 characters', 1)
    return
  }
  if (!password || password.length < 6) {
    send('Password must be at least 6 characters', 1)
    return
  }
  const client = await connect()
  const exists = await p(client, client.hexists)('username-id', username)
  if (exists !== 0) {
    send('Username is already in use', 1)
    client.quit()
    return
  }
  // Create a user in redis
  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash(password, salt)
  const user = {
    username,
    createdAt: new Date(),
    id: uuid.v4(),
    passwordHash,
  }
  const multi = client.multi()
  multi.hsetnx('users', user.id, JSON.stringify(user))
  multi.hsetnx('username-id', user.username, user.id)
  const results = await p(multi, multi.exec)()
  client.quit()
  for (const result of results) {
    if (result === 1) continue
    send('Failed to create user', 1)
    return
  }
  const token = jwt.sign({
    ...user,
    passwordHash: ''
  }, process.env.WEB_TOKEN_SECRET)
  send({
    ...user,
    token,
    passwordHash: '',
  })
}

exports.login = async (data, send) => {
  const { username, password } = data
  if (!username) {
    send('No username supplied', 1)
    return
  }
  if (!password) {
    send('No password supplied', 1)
    return
  }
  const client = await connect()
  const userId = await p(client, client.hget)('username-id', username)
  if (!userId) {
    send(`Unable to find user "${username}"`, 1)
    client.quit()
    return
  }
  const _user = await p(client, client.hget)('users', userId)
  client.quit()
  if (!_user) {
    send(`Unable to find user`, 1)
    return
  }
  const user = JSON.parse(_user)
  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    send('Incorrect password supplied', 1)
    return
  }
  const token = jwt.sign({
    ...user,
    passwordHash: '',
  }, process.env.WEB_TOKEN_SECRET)
  send({
    token,
    ...user,
    passwordHash: ''
  })
}

exports.load = async (data, send) => {
  const { id } = parseAuth(data.token)
  const client = await connect()
  const user = JSON.parse(await p(client, client.hget)('users', id))
  client.quit()
  send({
    ...user,
    passwordHash: '',
  })
}
