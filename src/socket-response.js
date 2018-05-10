/**
 * @module socketResponse
 *
 * @param {object} connection socket connection
 * @param {string} route the route to handle
 */
export default (connection, url) => {
  return {
    send: (text = 'ok') => connection.send(
      JSON.stringify({url, status: 200, value: text})
    ),
    error: text => connection.send(JSON.stringify({url, value: text}))
  }
}
