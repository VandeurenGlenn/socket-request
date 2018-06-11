/* socket-request version 0.2.0 */
'use strict';

const ENVIRONMENT = {version: '0.2.0', production: true};

var websocket = require('websocket');

class PubSub {

  /**
   * Creates handlers
   */
  constructor() {
    this.subscribers = {};
    this.values = [];
  }

  /**
   * @param {String} event
   * @param {Method} handler
   * @param {HTMLElement} context
   */
  subscribe(event, handler, context) {
    if (typeof context === 'undefined') {
      context = handler;
    }
    this.subscribers[event] = this.subscribers[event] || { handlers: []};
    this.subscribers[event].handlers.push(handler.bind(context));
  }

  /**
   * @param {String} event
   * @param {Method} handler
   * @param {HTMLElement} context
   */
  unsubscribe(event, handler, context) {
    if (typeof context === 'undefined') {
      context = handler;
    }
    const i = this.subscribers[event].handlers.indexOf(handler.bind(context));
    this.subscribers[event].handlers.splice(i);
  }

  /**
   * @param {String} event
   * @param {String|Number|Boolean|Object|Array} change
   */
  publish(event, change) {
    this.subscribers[event].handlers.forEach(handler => {
      if (this.values[event] !== change)
        handler(change, this.values[event]);
        this.values[event] = change;
      });
  }
}

const socketRequestClient = (port = 6000, protocol = 'echo-protocol', pubsub) => {
  if (!pubsub) pubsub = new PubSub();
  const onerror = error => {
    pubsub.publish('error', error);
  };

  const onmessage = message => {
    const {value, url, status} = JSON.parse(message.data.toString());

    if (status === 200) {
      pubsub.publish(url, value);
    } else {
      onerror(`Failed requesting ${type} @onmessage`);
    }

  };

  const send = (client, request) => {
    client.send(Buffer.from(JSON.stringify(request)));
  };

  const on = (url, cb) => {
    pubsub.subscribe(url, cb);
  };

  /**
   * @param {string} type
   * @param {string} name
   * @param {object} params
   */
  const request = (client, request) => {
    return new Promise((resolve, reject) => {
      on(request.url, result => {
        resolve(result);
      });
      send(client, request);
    });
  };

  const clientConnection = client => {
    return {
      client,
      request: req => request(client, req),
      send: req => send(client, req),
      close: exit => {
        client.onclose = message => {
          if (exit) process.exit();
        };
        client.close();
      }
    }
  };

  return new Promise(resolve => {
    const init = () => {
      let ws;
      if (typeof process === 'object') {
        ws = require('websocket').w3cwebsocket;
      } else {
        ws = WebSocket;
      }
      const client = new ws(`ws://localhost:${port}/`, protocol);

      client.onmessage = onmessage;
      client.onerror = onerror;
      client.onopen = () => resolve(clientConnection(client));
      client.onclose = message => {
        console.log(`${protocol} Client Closed`);
        // TODO: fail after 10 times
        if (message.code === 1006) {
          console.log('Retrying in 3 seconds');
          setTimeout(() => {
            return init();
          }, 3000);
        }
      };
    };
    return init();
  });
};

/**
 * @module socketResponse
 *
 * @param {object} connection socket connection
 * @param {string} route the route to handle
 */
var socketConnection = request => {
  // console.log(request);
  const connection = request.accept('echo-protocol', request.origin);
  console.log((new Date()) + ' Connection accepted.');
  return connection;
}

/**
 * @module socketResponse
 *
 * @param {object} connection socket connection
 * @param {string} url the request url
 */
var response = (connection, url) => {
  const send = (data = 'ok', status = 200) => connection.send(
    JSON.stringify({url, status, value: data})
  );
  const error = data => connection.send(JSON.stringify({url, value: data}));
  return {
    send,
    error
  }
}

const socketRequestServer = ({httpServer, port}, routes) => {
  if (!httpServer) {
    const { createServer } = require('http');
    httpServer = createServer();

    httpServer.listen(port, () => {
      console.log(`listening on ${port}`);
    });
  }

	const socketServer = new websocket.server({
  	httpServer,
  	autoAcceptConnections: false
	});

	const originIsAllowed = origin => {
  	// put logic here to detect whether the specified origin is allowed.
  	return true;
	};

  const connections = [];
  let connection;

	socketServer.on('request', request => {
  	if (!originIsAllowed(request.origin)) {
  		// Make sure we only accept requests from an allowed origin
  		request.reject();
  		console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
  		return;
  	}

    connection = socketConnection(request);
    connections.push(connection);

    const routeHandler = message => {
      let data;
      if (message.type) {
        switch (message.type) {
          case 'binary':
            data = message.binaryData.toString();
            break;
          default:

        }
      }
      const { route, params, url } = JSON.parse(data.toString());
      if (routes[url]) routes[url](params, response(connection, url));
      else return `nothing found for ${message.url}`;
    };

    connection.on('message', routeHandler);
	});

  return {
    close: () => {
      socketServer.shutDown();
    },
    connections: () => connections
  };
};

/**
 * @param {array|object} connection [port, protocol] or interface of socket-request-client
 */
const clientRequest = async connection => {
  if (Array.isArray(connection)) {
    if (typeof connection[0] !== 'number') throw 'Expected port to be a number';
    if (typeof connection[1] !== 'string') throw 'Expected protocol to be a string';
    connection = await socketRequestClient(connection[0], connection[1]);
  }

  return (url, params) => connection.request({url, params});
};

var index = {
  clientRequest,
  client: socketRequestClient,
  server: socketRequestServer
}

module.exports = index;
