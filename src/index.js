import { server as WebSocketServer, w3cwebsocket as WebSocket } from 'websocket';
import socketConnection from './socket-connection';
import response from './socket-response';
import PubSub from 'PubSub';

export const server = ({httpServer, port}, routes) => {
  if (!httpServer) {
    const { createServer } = require('http');
    httpServer = createServer();

    httpServer.listen(port, () => {
      console.log(`listening on ${port}`);
    });
  }

	const socketServer = new WebSocketServer({
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
    }

    connection.on('message', routeHandler);
	});

  return {
    close: () => {
      socketServer.shutDown()
    },
    connections: () => connections
  };
};
export const clientConnection = (port = 6000, protocol = 'echo-protocol') => {
  const pubsub = new PubSub();

  const onerror = error => {
    pubsub.publish('error', error);
  }

  const onmessage = message => {
    const {value, url, status} = JSON.parse(message.data.toString());

    if (status === 200) {
      pubsub.publish(url, value);
    } else {
      onerror(`Failed requesting ${type} @onmessage`);
    }

  }

  const send = (client, request) => {
    client.send(Buffer.from(JSON.stringify(request)))
  }

  const on = (url, cb) => {
    pubsub.subscribe(url, cb);
  }

  /**
   * @param {string} type
   * @param {string} name
   * @param {object} params
   */
  const request = (client, request) => {
    return new Promise((resolve, reject) => {
      on(request.url, result => {
        resolve(result)
      });
      send(client, request);
    });
  }

  const clientConnection = client => {
    return {
      request: req => request(client, req),
      send: req => send(client, req),
      close: exit => {
        client.onclose = message => {
          if (exit) process.exit()
        }
        client.close();
      }
    }
  }

  return new Promise(resolve => {
    const init = () => {
      const client = new WebSocket(`ws://localhost:${port}/`, protocol);

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
    }
    return init();
  });
}
