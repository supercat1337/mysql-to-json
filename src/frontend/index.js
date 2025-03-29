// @ts-check

import * as ServerApi from "./api.js";
import { delegate_event, escapeHtml } from "./dom-helper.js";
import { is_response_ok } from "./inet.js";

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

    let response = await ServerApi.tables_list({
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

    let response = await ServerApi.database_list();

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

            output_textarea.value = "";
            table_schema = await loadDatabaseSchema();

            let list = getTablesNamesFromDatabaseSchema(table_schema);
            table_list_area.innerHTML = createTableList(list);
        }
    );
