// @ts-check
import { request } from './inet.js';

/**
 * @typedef {Object} ApiResponse
 * @property {(false|object|string)} result
 * @property {(false|object|string)} error
 * @property {object} [response]
 */

/**
 * @param {Object} [params]
 * @returns {Promise<{result: string[], error:false}|{result: null,error: string}>}
 */
export async function database_list(params = {}) {
    return request('database.list', params);
}

/**
 * @param {Object} params
 * @param {string} params.database_name
 * @returns {Promise<{result: import("@supercat1337/mysql-schema-parser").ColumnMetadataRaw[], error:false}|{result: null,error: string}>}
 */
export async function tables_list(params) {
    return request('tables.list', params);
}

/**
 * @param {Object} params
 * @param {string} params.database_name
 * @param {string[]} [params.table_names]
 * @returns {Promise<{result: any[], error:false}|{result: null,error: string}>}
 */
export async function indexes_list(params) {
    return request('indexes.list', params);
}
