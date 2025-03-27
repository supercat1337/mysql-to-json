// @ts-check

import minimist from "minimist";
import { setCredentials } from "./db.js";
import { startServer } from "./server.js";

/**
 * Initializes the application by parsing command line arguments,
 * setting database credentials, and starting the server.
 *
 * Command line options:
 * --port PORT       The port number to listen on. Default is 3000.
 * --db_port PORT    The port number of the MySQL database. Default is 3306.
 * --db_host HOST    The host of the MySQL database. Default is localhost.
 * --user USER       The user of the MySQL database. Default is root.
 * --password PASS   The password of the MySQL database. Default is empty.
 * --help            Show this help message.
 */
export function startApp() {
    var argv = minimist(process.argv.slice(2));

    var args = {
        /** @type {number|undefined} */
        port: undefined,
        db_port: 3306,
        db_host: "localhost",
        user: "root",
        password: "",
    };

    for (var key in args) {
        if (argv[key]) {
            args[key] = argv[key];
        }

        setCredentials({
            host: args.db_host,
            user: args.user,
            port: args.db_port,
            password: args.password,
        });
    }

    if (argv.h || argv.help) {
        console.log(
            `Usage: node index.js [--port PORT] [--db_port PORT] [--db_host HOST] [--user USER] [--password PASSWORD]

Options:
--port PORT       The port number to listen on. Default is 3000.
--db_port PORT     The port number of the MySQL database. Default is 3306.
--db_host HOST    The host of the MySQL database. Default is localhost.
--user USER       The user of the MySQL database. Default is root.
--password PASS   The password of the MySQL database. Default is empty.
--help            Show this help message.`
        );
        process.exit(0);
    }

    startServer(argv.port);
}
