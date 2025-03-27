// @ts-check

import { request } from "./inet.js";

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
export async function database_list(params = {}){
	return request('database.list', params);
}

/**
 * @async
 * @function
 * @param {Object} params
 * @param {string} params.database_name
* @returns {Promise<ApiResponse>}
*/
export async function tables_list(params){
	return request('tables.list', params);
}