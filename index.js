const WebSocket = require('ws')

const wss = new WebSocket.Server({
  port: 4000,
  perMessageDeflate: false,
})

wss.on('connection', (ws) => {
  console.log('Client connected', ws)
  ws.on('message', (message) => {
    console.log('Received: ', message)
    ws.send('pong')
  })
})
