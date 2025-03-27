// @ts-check

export const dbUserCredentials = {
    host: "localhost",
    user: "root",
    port: 3306,
    password: "",
};

/**
 * Sets the user credentials for the MySQL database.
 * @param {Object} credentials
 * @property {string?} credentials.host
 * @property {string?} credentials.user
 * @property {number?} credentials.port
 * @property {string?} credentials.password
 */
export function setCredentials(credentials) {
    for (var key in credentials) {
        dbUserCredentials[key] = credentials[key];
    }
}
