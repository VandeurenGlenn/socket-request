const test = require('tape')
const socket = require('./');
const { createServer } = require('http');

test('server-client with httpServer defined', tape => {
  tape.plan(1)
  const httpServer = createServer()
  httpServer.listen(8080, () => {
    console.log(`listening on 8080`);
  });
  const { client, server } = socket;
  const api = server({httpServer, port: 8080}, {
    send: ({to, from, amount, message}, response) => {
      if (!to || !from || !amount) response.error(`Expected to, from & amount to be defined`)
      // add to mempool ...
      response.send();
    }
  });



  (async () => {
    const connection = await client(8080, 'echo-protocol');

    const value = await connection.request({url: 'send', params: {to: 'to', from: 'from', amount: 1}})
    tape.ok(value === 'ok')
    connection.close('exit')
  })()

});
