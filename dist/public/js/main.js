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

/**
 * Database column metadata object describing a table column's structure
 * @typedef {Object} ColumnMetadataRaw
 * @property {string} TABLE_CATALOG Table catalog (typically 'def' in MySQL)
 * @property {string} TABLE_SCHEMA Database/schema name containing the table
 * @property {string} TABLE_NAME Name of the table
 * @property {string} COLUMN_NAME Name of the column
 * @property {number} ORDINAL_POSITION Column position in table (1-based index)
 * @property {string|null} COLUMN_DEFAULT Default value for the column
 * @property {'YES'|'NO'} IS_NULLABLE Whether the column is nullable
 * @property {string} DATA_TYPE Column's data type (e.g., 'int', 'varchar')
 * @property {number|null} CHARACTER_MAXIMUM_LENGTH Maximum length for string types (in characters)
 * @property {number|null} CHARACTER_OCTET_LENGTH Maximum length for string types (in bytes)
 * @property {number|null} NUMERIC_PRECISION Precision for numeric types
 * @property {number|null} NUMERIC_SCALE Scale for numeric types
 * @property {number|null} DATETIME_PRECISION Precision for datetime types
 * @property {string|null} CHARACTER_SET_NAME Character set for string types
 * @property {string|null} COLLATION_NAME Collation for string types
 * @property {string} COLUMN_TYPE Full column type description (e.g., 'int(10) unsigned')
 * @property {'PRI'|'UNI'|'MUL'|''} COLUMN_KEY Column index type (PRI=primary key, UNI=unique, etc.)
 * @property {string} EXTRA Additional information (e.g., 'auto_increment')
 * @property {string} PRIVILEGES Comma-separated column privileges
 * @property {string} COLUMN_COMMENT Column comment
 * @property {'NEVER'|'ALWAYS'|string} IS_GENERATED Whether column value is generated
 * @property {string|null} GENERATION_EXPRESSION Expression for generated columns
 */

/**
 * @typedef {Object} ColumnMetadataParams
 * @property {string} tableCatalog - Table catalog (usually 'def')
 * @property {string} tableSchema - Database/schema name
 * @property {string} tableName - Table name
 * @property {string} columnName - Column name
 * @property {number} ordinalPosition - Position in table (1-based)
 * @property {string|null} columnDefault - Default value
 * @property {'YES'|'NO'} isNullable - Nullable status
 * @property {string} dataType - Data type (e.g. 'int', 'varchar')
 * @property {number|null} characterMaximumLength - Max length for string types (characters)
 * @property {number|null} characterOctetLength - Max length for string types (bytes)
 * @property {number|null} numericPrecision - Precision for numeric types
 * @property {number|null} numericScale - Scale for numeric types
 * @property {number|null} datetimePrecision - Precision for datetime types
 * @property {string|null} characterSetName - Character set for string types
 * @property {string|null} collationName - Collation for string types
 * @property {string} columnType - Full column type (e.g. 'int(11) unsigned')
 * @property {'PRI'|'UNI'|'MUL'|''} columnKey - Key type (primary/unique/etc.)
 * @property {string} extra - Extra information (e.g. 'auto_increment')
 * @property {string} privileges - Column privileges
 * @property {string} columnComment - Column comment
 * @property {'NEVER'|'ALWAYS'|string} isGenerated - Generation status
 * @property {string|null} generationExpression - Generation expression
 */

/**
 * Validate a raw column metadata object against the expected structure and types.
 * Throws an error if the object is invalid.
 * @param {ColumnMetadataRaw} obj Raw column metadata object
 * @returns {true} If the object is valid
 * @throws {Error} If the object is invalid
 */
function assertColumnMetadataRaw(obj) {
    if (typeof obj !== "object" || obj === null) {
        throw new Error("Input must be a non-null object");
    }

    const requiredKeys = [
        "TABLE_CATALOG",
        "TABLE_SCHEMA",
        "TABLE_NAME",
        "COLUMN_NAME",
        "ORDINAL_POSITION",
        "IS_NULLABLE",
        "DATA_TYPE",
        "COLUMN_TYPE",
        "COLUMN_KEY",
        "EXTRA",
        "PRIVILEGES",
        "COLUMN_COMMENT",
        "IS_GENERATED",
    ];

    for (const key of requiredKeys) {
        if (!(key in obj)) {
            throw new Error(`Missing required field: ${key}`);
        }
    }

    const validators = {
        TABLE_CATALOG: (val) =>
            typeof val === "string" || `Expected string, got ${typeof val}`,
        TABLE_SCHEMA: (val) =>
            typeof val === "string" || `Expected string, got ${typeof val}`,
        TABLE_NAME: (val) =>
            typeof val === "string" || `Expected string, got ${typeof val}`,
        COLUMN_NAME: (val) =>
            typeof val === "string" || `Expected string, got ${typeof val}`,
        ORDINAL_POSITION: (val) =>
            typeof val === "number" || `Expected number, got ${typeof val}`,
        COLUMN_DEFAULT: (val) =>
            val === null ||
            typeof val === "string" ||
            `Expected string or null, got ${typeof val}`,
        IS_NULLABLE: (val) =>
            val === "YES" ||
            val === "NO" ||
            `Expected 'YES' or 'NO', got ${val}`,
        DATA_TYPE: (val) =>
            typeof val === "string" || `Expected string, got ${typeof val}`,
        CHARACTER_MAXIMUM_LENGTH: (val) =>
            val === null ||
            typeof val === "number" ||
            `Expected number or null, got ${typeof val}`,
        CHARACTER_OCTET_LENGTH: (val) =>
            val === null ||
            typeof val === "number" ||
            `Expected number or null, got ${typeof val}`,
        NUMERIC_PRECISION: (val) =>
            val === null ||
            typeof val === "number" ||
            `Expected number or null, got ${typeof val}`,
        NUMERIC_SCALE: (val) =>
            val === null ||
            typeof val === "number" ||
            `Expected number or null, got ${typeof val}`,
        DATETIME_PRECISION: (val) =>
            val === null ||
            typeof val === "number" ||
            `Expected number or null, got ${typeof val}`,
        CHARACTER_SET_NAME: (val) =>
            val === null ||
            typeof val === "string" ||
            `Expected string or null, got ${typeof val}`,
        COLLATION_NAME: (val) =>
            val === null ||
            typeof val === "string" ||
            `Expected string or null, got ${typeof val}`,
        COLUMN_TYPE: (val) =>
            typeof val === "string" || `Expected string, got ${typeof val}`,
        COLUMN_KEY: (val) =>
            ["PRI", "UNI", "MUL", ""].includes(val) ||
            `Expected 'PRI', 'UNI', 'MUL' or empty string, got ${val}`,
        EXTRA: (val) =>
            typeof val === "string" || `Expected string, got ${typeof val}`,
        PRIVILEGES: (val) =>
            typeof val === "string" || `Expected string, got ${typeof val}`,
        COLUMN_COMMENT: (val) =>
            typeof val === "string" || `Expected string, got ${typeof val}`,
        IS_GENERATED: (val) =>
            val === "NEVER" ||
            val === "ALWAYS" ||
            typeof val === "string" ||
            `Expected 'NEVER', 'ALWAYS' or string, got ${val}`,
        GENERATION_EXPRESSION: (val) =>
            val === null ||
            typeof val === "string" ||
            `Expected string or null, got ${typeof val}`,
    };

    for (const [key, validator] of Object.entries(validators)) {
        const validationResult = validator(obj[key]);
        if (typeof validationResult === "string") {
            throw new Error(`Invalid ${key}: ${validationResult}`);
        }
    }

    return true;
}

/**
 * Class representing normalized database column metadata
 */
class MySQLTableColumn {
    /**
     * Table catalog (typically 'def' in MySQL)
     * @type {string}
     */
    tableCatalog;

    /**
     * Database/schema name containing the table
     * @type {string}
     */
    tableSchema;

    /**
     * Name of the table
     * @type {string}
     */
    tableName;

    /**
     * Name of the column
     *  @type {string}
     */
    columnName;

    /**
     * Column position in table (1-based index)
     * @type {number}
     */
    ordinalPosition;

    /**
     * Default value for the column
     * @type {string|null}
     */
    columnDefault;

    /**
     * Whether the column is nullable
     * @type {'YES'|'NO'}
     */
    isNullable;

    /**
     * Column's data type (e.g., 'int', 'varchar')
     * @type {string}
     */
    dataType;

    /**
     * Maximum length for string types (in characters)
     * @type {number|null}
     */
    characterMaximumLength;

    /**
     * Maximum length for string types (in bytes)
     * @type {number|null}
     */
    characterOctetLength;

    /**
     * Precision for numeric types
     * @type {number|null}
     */
    numericPrecision;

    /**
     * Scale for numeric types
     * @type {number|null}
     */
    numericScale;

    /**
     * Precision for datetime types
     * @type {number|null}
     */
    datetimePrecision;

    /**
     * Character set for string types
     * @type {string|null}
     */
    characterSetName;

    /**
     * Collation for string types
     * @type {string|null}
     */
    collationName;

    /**
     * Full column type description (e.g., 'int(10) unsigned')
     * @type {string}
     */
    columnType;

    /**
     * Column index type (PRI=primary key, UNI=unique, etc.)
     * @type {'PRI'|'UNI'|'MUL'|''}
     */
    columnKey;

    /**
     * Additional information (e.g., 'auto_increment')
     * @type {string}
     */
    extra;

    /**
     * Comma-separated column privileges
     * @type {string}
     */
    privileges;

    /**
     * Column comment
     * @type {string}
     */
    columnComment;

    /**
     * Whether column value is generated
     * @type {'NEVER'|'ALWAYS'|string}
     */
    isGenerated;

    /**
     * Expression for generated columns
     * @type {string|null}
     */
    generationExpression;

    /**
     * Creates an instance of ColumnMetadata from raw data
     * @param {ColumnMetadataParams} [data]
     */
    constructor(data) {
        if (!data) return;

        this.tableCatalog = data.tableCatalog;
        this.tableSchema = data.tableSchema;
        this.tableName = data.tableName;
        this.columnName = data.columnName;
        this.ordinalPosition = data.ordinalPosition;
        this.columnDefault = data.columnDefault;
        this.isNullable = data.isNullable;
        this.dataType = data.dataType;
        this.characterMaximumLength = data.characterMaximumLength;
        this.characterOctetLength = data.characterOctetLength;
        this.numericPrecision = data.numericPrecision;
        this.numericScale = data.numericScale;
        this.datetimePrecision = data.datetimePrecision;
        this.characterSetName = data.characterSetName;
        this.collationName = data.collationName;
        this.columnType = data.columnType;
        this.columnKey = data.columnKey;
        this.extra = data.extra;
        this.privileges = data.privileges;
        this.columnComment = data.columnComment;
        this.isGenerated = data.isGenerated;
        this.generationExpression = data.generationExpression;
    }

    /**
     * Import raw metadata into this object
     * @param {ColumnMetadataRaw} rawMetadata
     */
    importFromRawData(rawMetadata) {
        assertColumnMetadataRaw(rawMetadata);

        this.tableCatalog = rawMetadata.TABLE_CATALOG;
        this.tableSchema = rawMetadata.TABLE_SCHEMA;
        this.tableName = rawMetadata.TABLE_NAME;
        this.columnName = rawMetadata.COLUMN_NAME;
        this.ordinalPosition = rawMetadata.ORDINAL_POSITION;
        this.columnDefault = rawMetadata.COLUMN_DEFAULT;
        this.isNullable = rawMetadata.IS_NULLABLE;
        this.dataType = rawMetadata.DATA_TYPE;
        this.characterMaximumLength = rawMetadata.CHARACTER_MAXIMUM_LENGTH;
        this.characterOctetLength = rawMetadata.CHARACTER_OCTET_LENGTH;
        this.numericPrecision = rawMetadata.NUMERIC_PRECISION;
        this.numericScale = rawMetadata.NUMERIC_SCALE;
        this.datetimePrecision = rawMetadata.DATETIME_PRECISION;
        this.characterSetName = rawMetadata.CHARACTER_SET_NAME;
        this.collationName = rawMetadata.COLLATION_NAME;
        this.columnType = rawMetadata.COLUMN_TYPE;
        this.columnKey = rawMetadata.COLUMN_KEY;
        this.extra = rawMetadata.EXTRA;
        this.privileges = rawMetadata.PRIVILEGES;
        this.columnComment = rawMetadata.COLUMN_COMMENT;
        this.isGenerated = rawMetadata.IS_GENERATED;
        this.generationExpression = rawMetadata.GENERATION_EXPRESSION;
    }

    /**
     * Check if column is a primary key
     * @returns {boolean}
     */
    isPrimaryKey() {
        return this.columnKey === "PRI";
    }

    /**
     * Check if column allows NULL values
     * @returns {boolean}
     */
    allowsNull() {
        return this.isNullable === "YES";
    }

    /**
     * Check if column auto-increments
     * @returns {boolean}
     */
    isAutoIncrement() {
        return this.extra.includes("auto_increment");
    }

    /**
     * Get full column definition as string
     * @returns {string}
     */
    getColumnDefinition() {
        return (
            `${this.columnName} ${this.columnType}` +
            (this.isPrimaryKey() ? " PRIMARY KEY" : "") +
            (this.isAutoIncrement() ? " AUTO_INCREMENT" : "") +
            (this.allowsNull() ? "" : " NOT NULL")
        );
    }

    /**
     * Get a JSON representation of the column metadata
     * @returns {ColumnMetadataParams} JSON-serializable object with column metadata
     */
    toJSON() {
        return {
            ...this,
        };
    }
}

class MySQLDatabase {
    /** @type {string} */
    databaseName;
    /** @type {Map<string, MySQLTable>} */
    tables = new Map();

    /**
     * Creates an instance of MySQLDatabase.
     *
     * @param {string} databaseName - The name of the database.
     * @param {Array<{tableName: string, columns: ColumnMetadataRaw[]}>} [tables=[]] - An array of table objects with table name and columns metadata.
     */
    constructor(databaseName, tables = []) {
        this.databaseName = databaseName;

        for (let i = 0; i < tables.length; i++) {
            this.tables.set(
                tables[i].tableName,
                new MySQLTable(tables[i].tableName, tables[i].columns)
            );
        }
    }

    /**
     * Adds a table to the database.
     *
     * @param {MySQLTable} table - The table to add.
     */
    addTable(table) {
        this.tables.set(table.tableName, table);
    }
}

class MySQLTable {
    /** @type {string} */
    tableName;
    /** @type {Map<string, MySQLTableColumn>} */
    columns = new Map();

    /**
     * Creates MySQLTable instance from table name and columns data
     * @param {string} tableName Table name
     * @param {ColumnMetadataRaw[]} columns Columns data in snake_case format
     */
    constructor(tableName, columns = []) {
        this.tableName = tableName;

        for (let i = 0; i < columns.length; i++) {
            let column = new MySQLTableColumn();
            column.importFromRawData(columns[i]);

            this.columns.set(columns[i].COLUMN_NAME, column);
        }
    }

    /**
     * Adds a column to the table
     * @param {MySQLTableColumn} column The column to add
     */
    addColumn(column) {
        this.columns.set(column.columnName, column);
    }

    /**
     * Get all columns in table
     * @returns {MySQLTableColumn[]}
     */
    getColumns() {
        return Array.from(this.columns.values());
    }

    /**
     * Get column by name
     * @param {string} columnName
     * @returns {MySQLTableColumn|null}
     */
    getColumn(columnName) {
        return this.columns.get(columnName) || null;
    }

    /**
     * Generates CREATE TABLE SQL statement based on table metadata
     * @param {Object} [options] Additional options
     * @param {string} [options.engine] Storage engine (e.g. 'InnoDB')
     * @param {string} [options.charset] Default charset (e.g. 'utf8mb4')
     * @param {string} [options.collation] Default collation (e.g. 'utf8mb4_unicode_ci')
     * @param {string} [options.comment] Table comment
     * @returns {string} CREATE TABLE SQL query
     */
    generateCreateTableQuery(options = {}) {
        const columns = this.getColumns();
        if (columns.length === 0) {
            throw new Error(`Table ${this.tableName} has no columns`);
        }

        // Собираем определения колонок
        const columnDefinitions = [];
        const primaryKeys = [];
        const uniqueKeys = [];
        const indexes = [];

        for (const column of columns) {
            // Базовое определение колонки
            let definition = `\`${column.columnName}\` ${column.columnType}`;

            // NOT NULL
            if (!column.allowsNull()) {
                definition += " NOT NULL";
            }

            // DEFAULT
            if (column.columnDefault !== null) {
                const defaultValue = this.#formatDefaultValue(column);
                definition += ` DEFAULT ${defaultValue}`;
            }

            // AUTO_INCREMENT
            if (column.isAutoIncrement()) {
                definition += " AUTO_INCREMENT";
            }

            // COMMENT
            if (column.columnComment) {
                definition += ` COMMENT '${this.#escapeString(
                    column.columnComment
                )}'`;
            }

            columnDefinitions.push(definition);

            // Индексы
            if (column.isPrimaryKey()) {
                primaryKeys.push(`\`${column.columnName}\``);
            } else if (column.columnKey === "UNI") {
                uniqueKeys.push(`\`${column.columnName}\``);
            } else if (column.columnKey === "MUL") {
                indexes.push(`\`${column.columnName}\``);
            }
        }

        // Добавляем PRIMARY KEY
        if (primaryKeys.length > 0) {
            columnDefinitions.push(`PRIMARY KEY (${primaryKeys.join(", ")})`);
        }

        // Добавляем UNIQUE ключи
        for (const uniqueCol of uniqueKeys) {
            columnDefinitions.push(
                `UNIQUE KEY \`${uniqueCol.replace(
                    /`/g,
                    ""
                )}_unique\` (${uniqueCol})`
            );
        }

        // Собираем полный запрос
        let query = `CREATE TABLE \`${this.tableName}\` (\n  `;
        query += columnDefinitions.join(",\n  ");
        query += "\n)";

        // Добавляем ENGINE если указан
        if (options.engine) {
            query += ` ENGINE=${options.engine}`;
        }

        // Добавляем CHARSET и COLLATION
        const charset =
            options.charset || columns[0].characterSetName || "utf8mb4";
        const collation =
            options.collation ||
            columns[0].collationName ||
            "utf8mb4_unicode_ci";
        query += ` DEFAULT CHARSET=${charset} COLLATE=${collation}`;

        // Добавляем COMMENT таблицы
        if (options.comment) {
            query += ` COMMENT='${this.#escapeString(options.comment)}'`;
        }

        return query + ";";
    }

    /**
     * Formats default value for SQL query
     * @param {MySQLTableColumn} column
     * @returns {string}
     */
    #formatDefaultValue(column) {
        if (column.columnDefault === null) return "NULL";

        // Для строковых типов
        if (
            ["char", "varchar", "text", "enum", "set"].includes(
                column.dataType.toLowerCase()
            )
        ) {
            return `'${this.#escapeString(column.columnDefault)}'`;
        }

        // Для временных типов
        if (
            ["timestamp", "datetime"].includes(column.dataType.toLowerCase()) &&
            column.columnDefault.toUpperCase() === "CURRENT_TIMESTAMP"
        ) {
            return "CURRENT_TIMESTAMP";
        }

        // Для бинарных данных
        if (["blob", "binary"].includes(column.dataType.toLowerCase())) {
            return `x'${column.columnDefault}'`;
        }

        // Для остальных типов (числа, булевы и т.д.)
        return column.columnDefault;
    }

    /**
     * Escapes string for SQL
     * @param {string} str
     * @returns {string}
     */
    #escapeString(str) {
        return str.replace(/'/g, "''").replace(/\\/g, "\\\\");
    }
}

/**
 *
 * @param {ColumnMetadataRaw[]} data
 * @returns {string}
 */
function convertColumnMetadataToJsCode(data) {
    if (data.length === 0) {
        return "";
    }

    let db = new MySQLDatabase(data[0].TABLE_SCHEMA);

    for (let i = 0; i < data.length; i++) {
        let jsonData = data[i];
        let column = new MySQLTableColumn();
        column.importFromRawData(jsonData);

        let table = db.tables.get(column.tableName);
        if (!table) {
            table = new MySQLTable(column.tableName);
            db.addTable(table);
        }
        table.addColumn(column);
    }

    let output = [
        `
/**
 * @typedef {Object} ColumnMetadataParams
 * @property {string} tableCatalog - Table catalog (usually 'def')
 * @property {string} tableSchema - Database/schema name
 * @property {string} tableName - Table name
 * @property {string} columnName - Column name
 * @property {number} ordinalPosition - Position in table (1-based)
 * @property {string|null} columnDefault - Default value
 * @property {'YES'|'NO'} isNullable - Nullable status
 * @property {string} dataType - Data type (e.g. 'int', 'varchar')
 * @property {number|null} characterMaximumLength - Max length for string types (characters)
 * @property {number|null} characterOctetLength - Max length for string types (bytes)
 * @property {number|null} numericPrecision - Precision for numeric types
 * @property {number|null} numericScale - Scale for numeric types
 * @property {number|null} datetimePrecision - Precision for datetime types
 * @property {string|null} characterSetName - Character set for string types
 * @property {string|null} collationName - Collation for string types
 * @property {string} columnType - Full column type (e.g. 'int(11) unsigned')
 * @property {'PRI'|'UNI'|'MUL'|''} columnKey - Key type (primary/unique/etc.)
 * @property {string} extra - Extra information (e.g. 'auto_increment')
 * @property {string} privileges - Column privileges
 * @property {string} columnComment - Column comment
 * @property {'NEVER'|'ALWAYS'|string} isGenerated - Generation status
 * @property {string|null} generationExpression - Generation expression
 */

`,
    ];

    for (let table of db.tables.values()) {
        output.push(`export const ${table.tableName} = {`);
        for (let column of table.getColumns()) {
            output.push(`    ${column.columnName}: {`);
            for (let [key, value] of Object.entries(column.toJSON())) {
                output.push(`        ${key}: ${JSON.stringify(value)},`);
            }
            output.push(`    },\n`);
        }
        output.push(`};`);
    }

    return output.join("\n");
}

// @ts-check


let table_schema = [];

const reload_db_list_button = document.getElementById("reload_db_list_button");
const reload_table_list_button = document.getElementById(
    "reload_table_list_button"
);
const render_raw_json_button = document.getElementById(
    "render_raw_json_button"
);
const render_js_objects_button = document.getElementById(
    "render_js_objects_button"
);

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

render_raw_json_button?.addEventListener("click", () => {
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

render_js_objects_button?.addEventListener("click", () => {
    if (!output_textarea) return;

    let table_names = getCheckedCheckboxes();

    let result_schema = [];

    for (let i = 0; i < table_schema.length; i++) {
        if (!table_schema[i].TABLE_NAME) continue;

        if (table_names.indexOf(table_schema[i].TABLE_NAME) != -1) {
            result_schema.push(table_schema[i]);
        }
    }

    output_textarea.value = convertColumnMetadataToJsCode(result_schema);
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

reload_db_list_button?.click();
