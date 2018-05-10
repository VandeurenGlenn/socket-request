# socket-request
> Simple WebSocket request/response server & client

## usage
### server
```js
const { server } = require('socket-request');
const { createServer } = require('http');

const httpServer = createServer(); // define your own http server
const { server, clientConnection } = socket;
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
import { clientConnection } from 'socket-request';
const request = {url: 'user', params: {password: 'password', email:: 'email'}};

const client = clientConnection(6000, 'echo-protocol').then(client => {
  client.request(request).then(result => {
    console.log(result);
  });
  // or
  client.on('send', result => { console.log(result) });
  client.send(request);
});

```

## info
This project is likely to be split in the near future into:
- [ ] socket-request-client
- [ ] socket-request-server

These modules will be available through socket-request

*example*
```js
import { requestClient, requestServer } from 'socket-request';
```
Also socket-request will have the request method packed
```js
import { request } from 'socket-request';
request(url, {}) // returns {url, params}
```
