/**
 * @module socketResponse
 *
 * @param {object} connection socket connection
 * @param {string} url the request url
 */
export default (connection, url) => {
  return {
    send: (data = 'ok', status = 200) => connection.send(
      JSON.stringify({url, status, value: data})
    ),
    error: data => connection.send(JSON.stringify({url, value: data}))
  }
}
