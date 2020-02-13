const { server:ws } = require('websocket')
const http = require('http')

const server = http.createServer((req, res) => {
  console.log('Request for ', req.url)
  res.writeHead(401)
  res.end()
})

server.listen(8080, () => {
  console.log('Websocket server listening on port 8080')
})

const wsServer = new ws({
  httpServer: server,
  // Mark this false for production
  autoAcceptConnections: true,
})

function isOriginAllowed(origin) {
  // TODO implement
  process.exit(1)
}

wsServer.on('request', (req) => {
  if (!isOriginAllowed(req.origin)) {
    req.reject()
    return
  }
  const connection = req.accept('echo-protocol', req.origin)
  console.log('Connection accepted')
  connection.on('message', (message) => {
    console.log(message)
    if (message.type !== 'utf8') {
      return connection.sendBytes('UTF8 connections only'.toString(2))
    }
    connection.sendUTF('Hello')
  })
  connection.on('close', (reasonCode, description) => {
    console.log(`Peer ${connection.remoteAddress} disconnected (${reasonCode})`)
  })
})
