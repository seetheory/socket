const { parseAuth } = require('./user')
const { connect, p } = require('./db')

const SESSION_INTERVAL = 30*60*1000

exports.register = async (data, send) => {
  const { token, start } = data
  const { id } = parseAuth(token)
  const client = await connect()
  const multi = client.multi()
  multi.sadd(`session-${start}`, id)
  multi.scard(`session-${start}`)
  const [
    success,
    registeredUsers,
  ] = await p(multi, multi.exec)()
  send({
    start,
    registeredUsers
  })
}

exports.upcoming = async (data, send) => {
  const { after, count } = {
    after: +new Date(),
    count: 20,
    ...data,
  }
  const client = await connect()
  const upcoming = []
  const starts = []
  const multi = client.multi()
  for (let i = 1; i < count+1; i++) {
    const start = (Math.floor(after / SESSION_INTERVAL) + i) * SESSION_INTERVAL
    multi.scard(`session-${start}`)
    starts.push(start)
  }
  const userCounts = await p(multi, multi.exec)()
  client.quit()
  const events = starts.map((start, i) => {
    return {
      start,
      registeredUsers: userCounts[i],
    }
  })
  send(events)
}
