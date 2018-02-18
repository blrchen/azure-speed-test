export default class HttpClient {

  static get(url, options) {
    return HttpClient.ajax(url).then(response => {
      return HttpClient.getJson(url, response);
    });
  }

  static post(url, data, options) {
    options = options || {};
    HttpClient.setJsonPayload(options, data);
    options.method = 'POST';
    return HttpClient.ajax(url, options).then(response => {
      return HttpClient.getJson(url, response);
    });
  }

  static put(url, data, options) {
    options = options || {};
    HttpClient.setJsonPayload(options, data);
    options.method = 'PUT';
    return HttpClient.ajax(url, options).then(response => {
      return HttpClient.getJson(url, response);
    });
  }

  static patch(url, data, options) {
    options = options || {};
    HttpClient.setJsonPayload(options, data);
    options.method = 'PATCH';
    return HttpClient.ajax(url, options).then(response => {
      return HttpClient.getJson(url, response);
    });
  }

  static delete(url, options) {
    options = options || {};
    options.method = 'DELETE';
    return HttpClient.ajax(url, options).then(response => {
      var contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return HttpClient.getJson(url, response);
      }
      return {};
    });
  }

  static ajax(url, options) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers['Cache-Control'] = 'no-cache';
    // options.headers['Csrf-Token'] = 'nocheck';  Turn off to get ES api call work
    return fetch(url, options).then(
      response => {
        if (response.status < 300) {
          return response;
        } else if (response.status === 401) {
          // Sign in required
          console.warn('User needs to sign in for: ' + url);
          return null;
        } else if (response.status === 403) {
          // Signed in but not authorized
          console.error('User is not authorized for: ' + url);
          return null;
        } else {
          var error = new Error(response.status + ': ' + response.statusText);
          error.response = response;
          throw error;
        }
      }
    );
  }

  static getJson(url, response) {
    if (response && typeof response !== 'undefined') {
      return response.status !== 204 && response.status !== 401 && response.status !== 403
        ? response.json()
        : null;
    }

    console.warn("Response object for " + url + " is null.");
    return null;
  }

  static setJsonPayload(options, data) {
    options.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };
    options.body = JSON.stringify(data);
  }
}

