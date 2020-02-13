require('dotenv').config({})
const WebSocket = require('ws')

const wss = new WebSocket.Server({
  port: 4000,
  perMessageDeflate: false,
})

wss.on('connection', (ws) => {
  console.log('Client connected')
  ws.on('message', (message) => {
    // console.log('Received: ', message)
    try {
      const payload = JSON.parse(message)
      handleMessage(payload, ws)
    } catch (err) {
      ws.send({
        status: 1,
        error: 'Failed to parse JSON',
      })
    }
  })
})

const functionFiles = {
  user: require('./functions/user'),
  session: require('./functions/session')
}

/**
 * serialize
 **/
function serializeSend(payload, ws) {
  try {
    ws.send(JSON.stringify(payload))
  } catch (err) {
    ws.send(JSON.stringify({
      status: 1,
      message: 'Failed to serialize message',
      data: err,
    }))
  }
}

/**
 * calls a function in a file at func, passes data
 * payload: { func: string, data: object }
 * example: { func: 'user.create', data: { username: 'seetheory' ... }}
 **/
async function handleMessage(payload, ws) {
  const { func, _rid } = payload

  if (!_rid) {
    serializeSend({
      status: 1,
      message: 'Supply a v4 uuid as _rid for request identification',
    }, ws)
  }
  const send = (_message, _data, _status) => {
    const message = typeof _message === 'string' ? _message : ''
    let data = {}
    if (typeof _message === 'object' || Array.isArray(_message)) {
      data = _message
    } else if (typeof _data === 'object' || Array.isArray(_message)) {
      data = _data
    }
    let status = 0
    if (!isNaN(_status)) {
      status = _status
    } else if (!isNaN(_data)) {
      status = _data
    } else if (!isNaN(_message)) {
      status = _message
    }
    serializeSend({
      status,
      _rid,
      data,
      message: message || (status === 0 ? 'Success' : 'Failure'),
    }, ws)
  }
  try {
    // ['user, 'create'] = 'user.create'.split('.')
    const args = func.split('.')
    // fn = require('user')['create']
    const fn = functionFiles[args[0]][args[1]]
    if (!fn) {
      serializeSend({
        status: 4,
        _rid,
        message: `Could not find function "${func}"`,
      })
      return
    }
    await fn(payload.data, send)
  } catch (err) {
    console.log(`Func ${func} threw an uncaught error`)
    console.log(err)
    serializeSend({
      status: 1,
      _rid,
      message: `Func ${func} threw an uncaught error`,
      data: {
        error: err.toString(),
      },
    }, ws)
  }
}
