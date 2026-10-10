(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KaalingaAPI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function failure(message, status, code) {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
  }
  async function request(path, options = {}, fetcher = fetch) {
    let response, text;
    try {
      response = await fetcher(path, {
        credentials: 'same-origin', signal: AbortSignal.timeout(12000), ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers }
      });
      text = await response.text();
    } catch (error) {
      const timedOut = ['AbortError', 'TimeoutError'].includes(error.name);
      throw failure(timedOut ? 'The connection timed out. Please retry.' : 'Cannot reach Kaalinga. Check the server connection and retry.', 0, timedOut ? 'request_timeout' : 'connection_failed');
    }
    const contentType = (response.headers.get('content-type') || '').split(';')[0].trim();
    if (!/^application\/(?:json|[\w.-]+\+json)$/i.test(contentType)) {
      throw failure('The service returned an unexpected response (HTTP ' + response.status + '). Please retry the connection.', response.status, 'unexpected_response_type');
    }
    let result;
    try { result = JSON.parse(text); }
    catch (_) {
      throw failure('The service returned an unreadable response (HTTP ' + response.status + '). Please retry the connection.', response.status, 'invalid_json_response');
    }
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      throw failure('The service returned incomplete data. Please retry the connection.', response.status, 'invalid_response_data');
    }
    if (!response.ok) {
      throw failure(typeof result.error === 'string' && result.error.trim() ? result.error : 'Request failed (HTTP ' + response.status + '). Please retry.', response.status, 'api_error');
    }
    return result;
  }
  return { request };
});
