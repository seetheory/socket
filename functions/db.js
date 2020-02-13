const redis = require('redis')

exports.connect = async (options = {}) => {
  return await new Promise((rs, rj) => {
    const client = redis.createClient({
      port: process.env.REDIS_PORT || 6379,
      host: process.env.REDIS_HOST || 'localhost',
      ...options,
    })
    client.on('connect', () => {
      client.auth(process.env.REDIS_PASSWORD || 'password', (err) => {
        if (err) return rj(err)
        rs(client)
      })
    })
    client.on('error', (err) => {
      console.log('Client error', err)
    })
  })
}

exports.p = (_this, fn) => {
  return async (...args) => {
    return await new Promise((rs, rj) => {
      fn.call(_this, ...args, (err, ..._args) => {
        if (err) {
          return rj(err)
        }
        rs(..._args)
      })
    })
  }
}
