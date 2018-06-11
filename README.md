# socket-request
> Simple WebSocket request/response server & client

## usage
### server
```js
const { server } = require('socket-request');
const { createServer } = require('http');

const httpServer = createServer(); // define your own http server
server({httpServer, port: 6000}, {
  user: ({email, password}, response) => {
    if (!email || !password) {
      response.error(`Expected email & password to be defined`)
    } else {
      // do something
      response.send('some value')
    }
  }
});

```

### client
**note: server also works with the WebSocket module in supported browsers**
```js
import { client } from 'socket-request';
const request = {url: 'user', params: {password: 'password', email:: 'email'}};

client(6000, 'echo-protocol').then(connection => {
  connection.request(request).then(result => {
    console.log(result);
  });
  // or
  connection.on('send', result => { console.log(result) });
  connection.send(request);
});

```

### clientRequest
```js
import { clientRequest } from 'socket-request';
(async () => {
  const connection = await client(6000);
  const request = clientRequest(connection);
  // or 
  // const request = clientRequest([6000, 'echo-protocol']);
  const response = await request(url, {});
  // also usefull for creating client api's
  const api = {
    write: obj => request('APIURL/write', obj)
  }
  
  api.write({hello: 'world'})
})()
```
