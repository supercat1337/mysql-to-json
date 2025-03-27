// @ts-check

/**
 * Generates a unique identifier, which is a string with a dot in the middle.
 * The left part is the current time in milliseconds since the Unix epoch,
 * converted to base 36, and the right part is a random number between 0 and 1,
 * converted to base 36, and then sliced to 14 characters.
 *
 * @returns {string}
 */
const uid = function () {
    return (
        (Date.now() - 1640984400000).toString(36) +
        "." +
        (window.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967295)
            .toString(36)
            .slice(2, 16)
    );
};

/**
 * Creates a FormData object from the given method and parameters.
 * If no parameters are given, one parameter named "value" is added with the value of 1.
 * The method is added to the FormData object as a parameter named "method".
 * The parameters are added to the FormData object as parameters named "params[name]",
 * where name is the key of the parameter in the given object.
 * @param {string} method
 * @param {Object} [_params]
 * @returns {FormData}
 */
export function createFormData(method, _params) {
    _params = _params || {};

    var params = Object.entries(_params);

    if (params.length == 0) params = [["value", 1]];

    var formData = new FormData();

    formData.append("method", method);

    for (var i = 0; i < params.length; i++) {
        formData.append("params[" + params[i][0] + "]", params[i][1]);
    }

    return formData;
}

/**
 * Prepares an XMLHttpRequest and sets up its `onreadystatechange` handler.
 * The handler invokes the provided callback with the parsed JSON response
 * if the request is successful (HTTP status 200). If parsing fails or the
 * server returns an error status, the callback is invoked with an error
 * message. In case of network issues (status 0), a "No Internet" error is
 * reported. The function returns the XMLHttpRequest object.
 *
 * @param {Function} response_callback - A callback function to handle the response,
 * which receives `result`, `error`, and the full response object as arguments.
 * @returns {XMLHttpRequest} - The prepared XMLHttpRequest object.
 */
export function request_prepare(response_callback) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState != 4) return;

        if (this.status == 200) {
            try {
                let obj = JSON.parse(this.responseText);

                response_callback(obj.result, obj.error, obj);
            } catch (e) {
                response_callback(this.responseText, e);
            }
        } else {
            if (this.status == 0) {
                response_callback(false, "No Internet");
            } else {
                let error_text = `${this.responseURL} ${this.status} (${this.statusText})`;
                response_callback(false, error_text);
            }
        }
    };

    return req;
}

/**
 * Sends a POST request to the server using the provided XMLHttpRequest object
 * and FormData. The request URL includes a random query parameter generated
 * by the `uid` function to prevent caching. In case of an error during the
 * `send` operation, it logs the error to the console.
 *
 * @param {XMLHttpRequest} req - The XMLHttpRequest object to use for sending the request.
 * @param {FormData} formData - The FormData object containing the data to be sent with the request.
 */
export function request_send(req, formData) {
    const url = "api?random=" + uid();
    req.open("POST", url, true);

    try {
        req.send(formData);
    } catch (e) {
        console.error(e);
    }
}

/**
 * Sends an asynchronous HTTP POST request to the server.
 * If a callback is provided, it will be used with the XMLHttpRequest directly.
 * Otherwise, returns a Promise that resolves with the response data.
 *
 * @param {string} method - The API method to be called.
 * @param {Object} _params - The parameters to include with the request.
 * @param {Function} [callback] - Optional callback function to handle the response.
 * @returns {Promise|XMLHttpRequest} - Returns a Promise if no callback is provided, otherwise returns the XMLHttpRequest object.
 */
export function request(method, _params, callback) {
    var formData = createFormData(method, _params);

    if (callback) {
        let req = request_prepare(callback);
        request_send(req, formData);
        return req;
    } else {
        return new Promise(function (resolve, reject) {
            var req = request_prepare((result, error, response) => {
                resolve({ result, error, response });
            });

            request_send(req, formData);
        });
    }
}

/**
 * Returns a successful response object with the result set to the provided data.
 * If no data is provided, the result is set to true.
 * @param {Object|string} [data=true]
 * @returns {Object}
 */
export function response_ok(data = true) {
    return {
        result: data,
        error: false,
    };
}

/**
 * Returns an error response object with the provided error message.
 * The result property is set to false indicating failure.
 * @param {string|Object} error - The error message or object to include in the response.
 * @returns {Object} An object containing a false result and the specified error.
 */
export function response_error(error) {
    return {
        result: false,
        error: error,
    };
}

/**
 * Checks if a response object is OK. A response object is considered OK if it is defined
 * and its error property is falsy.
 * @param {Object} response - The response object to check.
 * @returns {boolean} True if the response is OK, False otherwise.
 */
export function is_response_ok(response) {
    return response && !response.error;
}
