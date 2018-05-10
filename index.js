/* socket-request version 0.1.0 */
'use strict';

const ENVIRONMENT = {version: '0.1.0', production: true};

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var websocket = require('websocket');
var PubSub = _interopDefault(require('PubSub'));

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
 * @param {string} route the route to handle
 */
var response = (connection, url) => {
  return {
    send: (text = 'ok') => connection.send(
      JSON.stringify({url, status: 200, value: text})
    ),
    error: text => connection.send(JSON.stringify({url, value: text}))
  }
}

const server = ({httpServer, port}, routes) => {
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

	socketServer.on('request', request => {
  	if (!originIsAllowed(request.origin)) {
  		// Make sure we only accept requests from an allowed origin
  		request.reject();
  		console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
  		return;
  	}

    const connection = socketConnection(request);
      
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
    }
  };
};
const clientConnection = (port = 6000, protocol = 'echo-protocol') => {
  const pubsub = new PubSub();
  
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
      const client = new websocket.w3cwebsocket(`ws://localhost:${port}/`, protocol);

      client.onmessage = onmessage;
      client.onerror = onerror;
      client.onopen = () => resolve(clientConnection(client));
      client.onclose = message => {
        // TODO: fail after 10 times
        if (message.code === 1006) {
          console.log('echo-protocol Client Closed');
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

exports.server = server;
exports.clientConnection = clientConnection;
