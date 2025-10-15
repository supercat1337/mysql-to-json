// @ts-check

/**
 * Detects the type of a column
 * @param {import("@supercat1337/mysql-schema-parser").MySQLTableColumn} column - The column to get the type of
 * @returns {"bit"|"integer"|"string"|"float"} The column type
 */
export function detectFieldTypeByColumnType(column) {
    if (hasBooleanDataType(column)) return "bit";
    if (hasIntegerDataType(column)) return "integer";
    if (hasStringDataType(column)) return "string";
    if (hasFloatDataType(column)) return "float";

    //throw new Error("Unknown column type");
    return "string";
}

/**
 * Checks if a column has an integer data type
 * @param {import("@supercat1337/mysql-schema-parser").MySQLTableColumn} column - The column to check
 * @returns {boolean} - True if the column has an integer data type, false otherwise
 */
export function hasIntegerDataType(column) {
    // INTEGER, INT, SMALLINT, TINYINT, MEDIUMINT, BIGINT
    let dataType = column.dataType.toLowerCase();

    if (/bigint/.test(dataType)) throw new Error("bigint not supported");

    return /integer|int|smallint|tinyint|mediumint|bigint/.test(dataType);
}

/**
 * Checks if a column has a boolean data type
 * @param {import("@supercat1337/mysql-schema-parser").MySQLTableColumn} column - The column to check
 * @returns {boolean} - True if the column has a boolean data type, false otherwise
 */
export function hasBooleanDataType(column) {
    let dataType = column.dataType.toLowerCase();
    if (column.columnType.toLowerCase() === "tinyint(1)") return true;
    if (hasIntegerDataType(column)) {
        let columnName = column.columnName.toLowerCase();
        return /^is_|_is_|^has_/.test(columnName);
    }
    return dataType === "boolean";
}

/**
 * Checks if a column has a float data type
 * @param {import("@supercat1337/mysql-schema-parser").MySQLTableColumn} column - The column to check
 * @returns {boolean} - True if the column has a float data type, false otherwise
 */
export function hasFloatDataType(column) {
    let dataType = column.dataType.toLowerCase();
    return /float|double|real|decimal/.test(dataType);
}

/**
 * Checks if a column has a string data type
 * @param {import("@supercat1337/mysql-schema-parser").MySQLTableColumn} column - The column to check
 * @returns {boolean} - True if the column has a string data type, false otherwise
 */
export function hasStringDataType(column) {
    let dataType = column.dataType.toLowerCase();
    return /char|varchar|tinytext|text|mediumtext|longtext/.test(dataType);
}

/**
 * Checks if a column has a date-related data type.
 * @param {import("@supercat1337/mysql-schema-parser").MySQLTableColumn} column - The column to check.
 * @returns {boolean} - True if the column has a date-related data type, false otherwise.
 */
export function hasDateDataType(column) {
    let dataType = column.dataType.toLowerCase();
    return /date|time|datetime|timestamp/.test(dataType);
}
