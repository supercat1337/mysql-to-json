// @ts-check
import mysql from 'mysql2/promise';
import { dbUserCredentials } from './db.js';

import bodyParser from 'body-parser';
import express from 'express';
import multer from 'multer';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Starts an express server.
 * @param {number} [port]
 * @returns {Promise<number>}
 */
export async function startServer(port) {
    const app = express();
    const upload = multer();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(express.static(__dirname + '/../dist/public'));

    app.post('/api', upload.none(), async (req, res) => {
        try {
            let data = req.body;
            let { method, params } = data;
            res.header('Access-Control-Allow-Origin', '*');

            if (method == 'tables.list') {
                let tables_response = await api_tables_list(params);
                res.json({
                    result: tables_response.result,
                    error: tables_response.error,
                    method,
                });
            } else if (method == 'database.list') {
                let databases_response = await api_database_list(params);
                res.json({
                    result: databases_response.result,
                    error: databases_response.error,
                    method,
                });
            } else if (method == 'indexes.list') {
                let indexes_response = await api_indexes_list(params);
                res.json({
                    result: indexes_response.result,
                    error: indexes_response.error,
                    method,
                });
            } else {
                res.json({ error: 'Unknown method', result: null, method });
            }
        } catch (err) {
            console.error(err);
            res.json({ result: null, error: err.message });
        }
    });

    if (port) {
        app.listen(port);
    } else {
        port = 8080;
        let running = false;
        for (let i = 0; i < 100; i++) {
            port += i;
            try {
                app.listen(port);
                running = true;
                break;
            } catch (err) {
                console.error(err);
            }
        }
        if (!running) throw new Error(`Could not find an available port!`);
    }
    return port;
}

/**
 * Returns list of databases.
 * @param {Object} params
 * @returns {Promise<{result: string[], error:false}|{result: null,error: string}>}
 */
export async function api_database_list(params) {
    try {
        const connection = await mysql.createConnection(dbUserCredentials);
        await connection.connect();
        const [rows] = await connection.query('SHOW DATABASES');
        let result = [];
        // @ts-ignore
        rows.forEach(row => result.push(row.Database));
        await connection.end();
        return { result, error: false };
    } catch (err) {
        console.log(err);
        return { error: err.message, result: null };
    }
}

/**
 * Returns column schema for a given database.
 * @param {{database_name: string}} params
 * @returns {Promise<{result: any[], error:false}|{result: null,error: string}>}
 */
export async function api_tables_list(params) {
    try {
        const connection = await mysql.createConnection(dbUserCredentials);
        let database_name = params.database_name;
        await connection.connect();
        let sql_database_name = connection.escape(database_name);
        const [rows] = await connection.query(
            `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = ${sql_database_name} ORDER BY table_name, ordinal_position;`
        );
        await connection.end();
        return { result: rows, error: false };
    } catch (err) {
        console.log(err);
        return { error: err.message, result: null };
    }
}

/**
 * Returns detailed index statistics for selected tables.
 * @param {{database_name: string, table_names?: string[]}} params
 * @returns {Promise<{result: any[], error:false}|{result: null,error: string}>}
 */
export async function api_indexes_list(params) {
    try {
        const connection = await mysql.createConnection(dbUserCredentials);
        const dbName = params.database_name;

        // Parse table_names if it was sent as a JSON string
        /** @type {string[]|string} */
        let tableNamesArray = params.table_names || '';
        if (typeof tableNamesArray === 'string') {
            try {
                tableNamesArray = JSON.parse(tableNamesArray);
            } catch (e) {
                // fallback: treat as comma-separated string

                tableNamesArray = tableNamesArray.split(',').map(s => s.trim());
            }
        }

        // Ensure we have an array for the SQL IN clause
        let tableFilter = '';
        if (tableNamesArray && Array.isArray(tableNamesArray) && tableNamesArray.length > 0) {
            const escapedTables = tableNamesArray.map(t => connection.escape(t)).join(',');
            tableFilter = `AND table_name IN (${escapedTables})`;
        }

        /*
        TABLE_SCHEMA,
                TABLE_NAME,
                INDEX_NAME,
                COLUMN_NAME,
                NON_UNIQUE,
                INDEX_TYPE,
                CARDINALITY,
                SUB_PART,
                NULLABLE,
                COLLATION
        */

        const query = `
            SELECT 
                *
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = ${connection.escape(dbName)} ${tableFilter}
            ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
        `;
        const [rows] = await connection.query(query);
        await connection.end();
        return { result: rows, error: false };
    } catch (err) {
        console.error(err);
        return { error: err.message, result: null };
    }
}
