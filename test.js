const test = require('tape')
const socket = require('./');
const { createServer } = require('http');

test('server-client with httpServer defined', tape => {
  tape.plan(1)
  const httpServer = createServer()
  httpServer.listen(4040, () => {
    console.log(`listening on 6000`);
  });
  const { server, clientConnection } = socket;
  const api = server({httpServer, port: 4040}, {
    send: ({to, from, amount, message}, response) => {
      if (!to || !from || !amount) response.error(`Expected to, from & amount to be defined`)
      // add to mempool ...
      response.send();
    }
  });



  (async () => {
    const client = await clientConnection(4040, 'echo-protocol');

    const value = await client.request({url: 'send', params: {to: 'to', from: 'from', amount: 1}})
    tape.ok(value === 'ok')
    api.close();
    client.close('exit');
  })()

});
