/**
 * @module socketResponse
 *
 * @param {object} connection socket connection
 * @param {string} route the route to handle
 */
export default request => {
  // console.log(request);
  const connection = request.accept('echo-protocol', request.origin);
  console.log((new Date()) + ' Connection accepted.');
  return connection;
}
