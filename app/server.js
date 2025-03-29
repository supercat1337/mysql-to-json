// @ts-check
import mysql from "mysql2/promise";
import { dbUserCredentials } from "./db.js";

import bodyParser from "body-parser";
import express from "express";
import multer from "multer";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

/**
 * Starts an express server at the specified port number.
 * The server listens for POST requests at /api.
 * The POST request body should contain the method name and parameters as JSON.
 * The server responds with the result of the method call as JSON.
 * If the method call fails, the server responds with an error message as JSON.
 *
 * @param {number} [port] - The port number to listen on.
 * @returns {Promise<number>} - The port number the server is listening on.
 * @throws {Error} - If the server cannot find an available port to listen on.
 */
export async function startServer(port) {
    const app = express();
    const upload = multer(); // for parsing multipart/form-data

    app.use(bodyParser.json()); // for parsing application/json
    app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

    app.use(express.static(__dirname + "/../dist/public"));

    app.post("/api", upload.none(), async (req, res) => {
        try {
            let data = req.body;
            let { method, params } = data;

            res.header("Access-Control-Allow-Origin", "*");

            if (method == "tables.list") {
                let tables_response = await api_tables_list(params);
                res.json({
                    result: tables_response.result,
                    error: tables_response.error,
                    method: method,
                });
            } else if (method == "database.list") {
                let databases_response = await api_database_list(params);
                res.json({
                    result: databases_response.result,
                    error: databases_response.error,
                    method: method,
                });
            } else {
                res.json({
                    error: "Unknown method",
                    result: null,
                    method: method,
                });
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

        if (!running) {
            throw new Error(`Could not find an available port to listen on!`);
        }
    }

    return port;
}

/**
 * Returns a list of databases. The list is an array of strings.
 * @param {Object} params
 * @returns {Promise<{result: string[], error:false}|{result: null,error: string}>}
 */
export async function api_database_list(params) {
    try {
        const connection = await mysql.createConnection(dbUserCredentials);

        connection.connect();
        const [rows, fields] = await connection.query("SHOW DATABASES");
        let result = [];

        //*
        // @ts-ignore
        rows.forEach((row) => {
            result.push(row.Database);
        });
        //*/

        connection.end();
        return { result: result, error: false };
    } catch (err) {
        console.log(err);
        return { error: err.message, result: null };
    }
}

/**
 *
 * @param {{database_name: string}} params
 * @returns {Promise<{result: string[], error:false}|{result: null,error: string}>}
 */
export async function api_tables_list(params) {
    try {
        const connection = await mysql.createConnection(dbUserCredentials);
        let database_name = params.database_name;
        connection.connect();

        let sql_database_name = connection.escape(database_name);

        //console.log(sql_database_name);

        const [rows, fields] = await connection.query(
            `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = ${sql_database_name} ORDER BY table_name, ordinal_position;`
        );
        let result = [];

        //*
        // @ts-ignore
        rows.forEach((row) => {
            result.push(row);
        });
        //*/

        connection.end();
        return { result: result, error: false };
    } catch (err) {
        console.log(err);
        return { error: err.message, result: null };
    }
}
