// @ts-check
import * as ServerApi from './api.js';
import { delegate_event, escapeHtml } from './dom-helper.js';
import { convertColumnMetadataToJsClassCode, convertColumnMetadataToJsCode } from './tools.js';

/** @type {import("@supercat1337/mysql-schema-parser").ColumnMetadataRaw[]} */
let table_schema = [];

// DOM elements
const reload_db_list_button = document.getElementById('reload_db_list_button');
const reload_table_list_button = document.getElementById('reload_table_list_button');
const render_raw_json_button = document.getElementById('render_raw_json_button');
const render_js_objects_button = document.getElementById('render_js_objects_button');
const render_js_class_button = document.getElementById('render_js_class_button');
const database_list_area = document.getElementById('database_list_area');
const table_list_area = document.getElementById('table_list_area');
const output_textarea = /** @type {HTMLTextAreaElement} */ (
    document.getElementById('output_textarea')
);
const stats_textarea = /** @type {HTMLTextAreaElement} */ (
    document.getElementById('stats_output_textarea')
);
const check_all_button = document.getElementById('check_all_button');
const uncheck_all_button = document.getElementById('uncheck_all_button');
const render_stats_button = document.getElementById('render_stats_button');

/**
 * @param {string[]} list
 */
function createDataBaseList(list) {
    let body = [];
    for (let i = 0; i < list.length; i++) {
        let text = escapeHtml(list[i]);
        body.push(`<a href="#" class="list-group-item list-group-item-action">${text}</a>`);
    }
    return `<div class="list-group">${body.join('\n')}</div>`;
}

function getActiveDataBase() {
    if (!database_list_area) return false;
    let active_element = /** @type {HTMLElement} */ (
        database_list_area.querySelector('.list-group-item.active')
    );
    return active_element ? active_element.innerText : false;
}

/**
 * @param {import("@supercat1337/mysql-schema-parser").ColumnMetadataRaw[]} schema
 * @returns {string[]}
 */
function getTablesNamesFromDatabaseSchema(schema) {
    let names = new Set();
    for (let i = 0; i < schema.length; i++) {
        names.add(schema[i].TABLE_NAME);
    }
    return Array.from(names);
}

/**
 * @param {string[]} list
 */
function createTableList(list) {
    let body = [];
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
    return `<div class="list-group">${body.join('\n')}</div>`;
}

async function loadDatabaseSchema() {
    if (!table_list_area) return [];
    let active_database = getActiveDataBase();
    if (active_database == false) return [];
    let response = await ServerApi.tables_list({
        database_name: active_database,
    });
    if (response.error) {
        alert(response.error);
        table_list_area.innerHTML = '';
        return [];
    }
    if (response.result == null) return [];
    return response.result;
}

function getCheckedCheckboxes() {
    if (!table_list_area) return [];
    let checkboxes = table_list_area.querySelectorAll('input[type=checkbox]');
    let names = [];
    checkboxes.forEach(checkbox => {
        // @ts-ignore
        if (checkbox.checked) names.push(checkbox.value);
    });
    return names;
}

// Load index statistics for checked tables & current database
// Inside src/frontend/index.js, replace the existing loadAndRenderIndexStats function

async function loadAndRenderIndexStats() {
    if (!stats_textarea) return;
    const activeDb = getActiveDataBase();
    if (!activeDb) {
        stats_textarea.value = '⚠️ Please select a database first.';
        return;
    }
    const tableNames = getCheckedCheckboxes();
    if (tableNames.length === 0) {
        stats_textarea.value = 'ℹ️ No tables selected. Please check at least one table.';
        return;
    }
    stats_textarea.value = '⏳ Loading index statistics...';

    // Send as JSON string to avoid FormData array serialization issues
    const response = await ServerApi.indexes_list({
        database_name: activeDb,
        table_names: JSON.stringify(tableNames), // 👈 convert array to string
    });

    if (response.error) {
        stats_textarea.value = `❌ Error: ${response.error}`;
        return;
    }
    if (response.result && response.result.length === 0) {
        stats_textarea.value = '📭 No index information found for selected tables.';
        return;
    }
    stats_textarea.value = JSON.stringify(response.result, null, 2);
}

// Event handlers
reload_db_list_button?.addEventListener('click', async () => {
    if (!database_list_area) return;
    let response = await ServerApi.database_list();
    if (response.error) {
        alert(response.error);
        database_list_area.innerHTML = '';
        return;
    }
    if (response.result == null) return;
    database_list_area.innerHTML = createDataBaseList(response.result);
});

reload_table_list_button?.addEventListener('click', async () => {
    if (!table_list_area) return;
    table_schema = await loadDatabaseSchema();
    let list = getTablesNamesFromDatabaseSchema(table_schema);
    table_list_area.innerHTML = createTableList(list);
});

check_all_button?.addEventListener('click', () => {
    if (!table_list_area) return;
    let checkboxes = table_list_area.querySelectorAll('input[type=checkbox]');
    checkboxes.forEach(cb => {
        cb.checked = true;
    });
});

uncheck_all_button?.addEventListener('click', () => {
    if (!table_list_area) return;
    let checkboxes = table_list_area.querySelectorAll('input[type=checkbox]');
    checkboxes.forEach(cb => {
        cb.checked = false;
    });
});

render_stats_button?.addEventListener('click', loadAndRenderIndexStats);

// Schema output rendering (existing)
function renderSchemaOutput(transformFn) {
    if (!output_textarea) return;
    let table_names = getCheckedCheckboxes();
    let result_schema = table_schema.filter(col => table_names.includes(col.TABLE_NAME));
    output_textarea.value = transformFn(result_schema);
}

render_raw_json_button?.addEventListener('click', () => {
    renderSchemaOutput(schema => JSON.stringify(schema, null, '  '));
});
render_js_class_button?.addEventListener('click', () => {
    renderSchemaOutput(convertColumnMetadataToJsClassCode);
});
render_js_objects_button?.addEventListener('click', () => {
    renderSchemaOutput(convertColumnMetadataToJsCode);
});

// Database click delegation to load tables
if (database_list_area && table_list_area) {
    delegate_event('click', database_list_area, '.list-group-item', async (event, target) => {
        let active_element = database_list_area.querySelector('.list-group-item.active');
        if (target == active_element) return;
        if (active_element) active_element.classList.toggle('active');
        target.classList.toggle('active');
        output_textarea.value = '';
        stats_textarea.value = '';
        table_schema = await loadDatabaseSchema();
        let list = getTablesNamesFromDatabaseSchema(table_schema);
        table_list_area.innerHTML = createTableList(list);
    });
}

reload_db_list_button?.click();
