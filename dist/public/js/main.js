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
function createFormData(method, _params) {
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
function request_prepare(response_callback) {
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
function request_send(req, formData) {
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
function request(method, _params, callback) {
    var formData = createFormData(method, _params);

    {
        return new Promise(function (resolve, reject) {
            var req = request_prepare((result, error, response) => {
                resolve({ result, error, response });
            });

            request_send(req, formData);
        });
    }
}

/**
 * Checks if a response object is OK. A response object is considered OK if it is defined
 * and its error property is falsy.
 * @param {Object} response - The response object to check.
 * @returns {boolean} True if the response is OK, False otherwise.
 */
function is_response_ok(response) {
    return response && !response.error;
}

// @ts-check


/**
 * @typedef {Object} ApiResponse
 * @property {(false|object|string)} result
 * @property {(false|object|string)} error
 * @property {object} [response]
 */

/**
 * @async
 * @function
 * @param {Object} [params]
* @returns {Promise<ApiResponse>}
*/
async function database_list(params = {}){
	return request('database.list', params);
}

/**
 * @async
 * @function
 * @param {Object} params
 * @param {string} params.database_name
* @returns {Promise<ApiResponse>}
*/
async function tables_list(params){
	return request('tables.list', params);
}

// @ts-check

/**
 * Delegates an event to a specified target element within an ancestor element.
 *
 * @param {string} event_type - The type of event to listen for (e.g., "click").
 * @param {HTMLElement} ancestor_element - The ancestor element to delegate the event from.
 * @param {string} target_element_selector - The CSS selector for the target element the event should be delegated to.
 * @param {Function} listener_function - The function to execute when the event is triggered on the target element.
 */
function delegate_event(
    event_type,
    ancestor_element,
    target_element_selector,
    listener_function
) {
    ancestor_element.addEventListener(event_type, function (event) {
        var target;

        if (event.target instanceof Element)
            if (typeof event.target.matches != "undefined") {
                target = event.target;

                if (event.target.matches(target_element_selector)) {
                    listener_function(event, target);
                } else if (event.target.closest(target_element_selector)) {
                    target = event.target.closest(target_element_selector);
                    listener_function(event, target);
                }
            }
    });
}

/**
 * Escapes unsafe HTML characters in a string to make it safe for use in web
 * pages.
 *
 * @param {string} unsafe - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// @ts-check


let table_schema = [];

const reload_db_list_button = document.getElementById("reload_db_list_button");
const reload_table_list_button = document.getElementById(
    "reload_table_list_button"
);
const render_button = document.getElementById("render_button");

const database_list_area = document.getElementById("database_list_area");
const table_list_area = document.getElementById("table_list_area");

const output_textarea = /** @type {HTMLTextAreaElement} */ (
    document.getElementById("output_textarea")
);

const check_all_button = document.getElementById("check_all_button");
const uncheck_all_button = document.getElementById("uncheck_all_button");

/**
 *
 * @param {string[]} list
 */
function createDataBaseList(list) {
    let body = [];
    let head = `<div class="list-group">`;
    let tail = `</div>`;

    for (let i = 0; i < list.length; i++) {
        let text = escapeHtml(list[i]);
        body.push(
            `<a href="#" class="list-group-item list-group-item-action" >${text}</a>`
        );
    }

    let html = [head, body.join("\n"), tail].join("\n");
    return html;
}

function getActiveDataBase() {
    if (!database_list_area) return false;
    let active_element = /** @type {HTMLElement} */ (
        database_list_area.querySelector(".list-group-item.active")
    );
    return active_element ? active_element.innerText : false;
}

/**
 *
 * @param {Array} table_schema
 * @returns {string[]}
 */
function getTablesNamesFromDatabaseSchema(table_schema) {
    /** @type {Set} */
    let names = new Set();

    for (let i = 0; i < table_schema.length; i++) {
        names.add(table_schema[i].TABLE_NAME);
    }

    return Array.from(names);
}

/**
 *
 * @param {string[]} list
 */
function createTableList(list) {
    let body = [];
    let head = `<div class="list-group">`;
    let tail = `</div>`;

    for (let i = 0; i < list.length; i++) {
        let text = escapeHtml(list[i]);

        body.push(`
    <div class="form-check">
        <label class="form-check-label">
            <input class="form-check-input" type="checkbox" value="${text}" checked="checked">
            ${text}
        </label>
      </div>`);
    }

    return [head, body.join("\n"), tail].join("\n");
}

async function loadDatabaseSchema() {
    if (!table_list_area) return [];
    let active_database = getActiveDataBase();

    if (active_database == false) return;

    let response = await tables_list({
        database_name: active_database,
    });
    if (!is_response_ok(response)) {
        alert(response.error);
        table_list_area.innerHTML = "";
        return;
    }

    return response.result;
}

function getCheckedCheckboxes() {
    if (!table_list_area) return [];
    let checkboxes = table_list_area.querySelectorAll("input[type=checkbox]");

    /** @type {string[]} */
    let names = [];

    checkboxes.forEach((checkbox) => {
        // @ts-ignore
        if (checkbox.checked) names.push(checkbox.value);
    });

    return names;
}

reload_db_list_button?.addEventListener("click", async () => {
    if (!database_list_area) return;

    let response = await database_list();

    if (!is_response_ok(response)) {
        alert(response.error);
        database_list_area.innerHTML = "";
        return;
    }

    database_list_area.innerHTML = createDataBaseList(response.result);
});

reload_table_list_button?.addEventListener("click", async () => {
    if (!table_list_area) return;

    table_schema = await loadDatabaseSchema();

    let list = getTablesNamesFromDatabaseSchema(table_schema);
    table_list_area.innerHTML = createTableList(list);
});

check_all_button?.addEventListener("click", () => {
    if (!table_list_area) return;

    let checkboxes = table_list_area.querySelectorAll("input[type=checkbox]");

    checkboxes.forEach((checkbox) => {
        // @ts-ignore
        checkbox.checked = true;
    });
});

uncheck_all_button?.addEventListener("click", () => {
    if (!table_list_area) return;

    let checkboxes = table_list_area.querySelectorAll("input[type=checkbox]");

    checkboxes.forEach((checkbox) => {
        // @ts-ignore
        checkbox.checked = false;
    });
});

render_button?.addEventListener("click", () => {
    if (!output_textarea) return;

    let table_names = getCheckedCheckboxes();

    let result_schema = [];

    for (let i = 0; i < table_schema.length; i++) {
        if (!table_schema[i].TABLE_NAME) continue;

        if (table_names.indexOf(table_schema[i].TABLE_NAME) != -1) {
            result_schema.push(table_schema[i]);
        }
    }

    output_textarea.value = JSON.stringify(result_schema, null, "  ");
});

if (database_list_area && table_list_area)
    delegate_event(
        "click",
        database_list_area,
        ".list-group-item",
        async (event, target) => {
            let active_element = database_list_area.querySelector(
                ".list-group-item.active"
            );

            if (target == active_element) return;

            if (active_element) active_element.classList.toggle("active");

            target.classList.toggle("active");
            table_schema = await loadDatabaseSchema();

            let list = getTablesNamesFromDatabaseSchema(table_schema);
            table_list_area.innerHTML = createTableList(list);
        }
    );
