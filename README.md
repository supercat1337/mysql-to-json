# mysql-to-json

A useful tool to get information about MySQL databases in JSON format.

## Overview

`mysql-to-json` is a command-line tool that connects to a MySQL database and retrieves information about the database in JSON format.

## Installation

To install `mysql-to-json`, run the following command:

```
npm install -g mysql-to-json
```

## Usage

To use `mysql-to-json`, run the following command:

```
mysql-to-json
```

You can customize the tool's behavior by passing options as command-line arguments. The available options are:

### Options

-   `--port PORT`: The port number to listen on. Default is 3000.
-   `--db_port PORT`: The port number of the MySQL database. Default is 3306.
-   `--db_host HOST`: The host of the MySQL database. Default is localhost.
-   `--user USER`: The user of the MySQL database. Default is root.
-   `--password PASS`: The password of the MySQL database. Default is empty.
-   `--help`: Show this help message.

## Example Usage

To retrieve information about a MySQL database on the default host and port:

```
node index.js
```

To connect to a MySQL database on a remote host:

```
node index.js --db_host example.com --db_port 3307 --user myuser --password mypass
```

## Output

The tool starts a local server on the specified port. Using a web browser, you can access the server and retrieve information about the database as JSON data.

## Contributing

Contributions are welcome! If you'd like to contribute to `mysql-to-json`, please fork this repository and submit a pull request.

## License

`mysql-to-json` is licensed under the MIT License.
