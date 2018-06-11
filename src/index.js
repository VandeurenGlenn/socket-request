import client from '../node_modules/socket-request-client/src/index.js';
import server from '../node_modules/socket-request-server/src/index.js';

/**
 * @param {array|object} connection [port, protocol] or interface of socket-request-client
 */
const clientRequest = async connection => {
  if (Array.isArray(connection)) {
    if (typeof connection[0] !== 'number') throw 'Expected port to be a number';
    if (typeof connection[1] !== 'string') throw 'Expected protocol to be a string';
    connection = await client(connection[0], connection[1]);
  }

  return (url, params) => connection.request({url, params});
}

export default {
  clientRequest,
  client,
  server
}
