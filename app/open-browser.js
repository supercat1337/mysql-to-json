// @ts-check

import { execFileSync } from "child_process";

const commands = () => {
    const { platform } = process;
    switch (platform) {
        case "android":
        case "linux":
            return ["xdg-open"];
        case "darwin":
            return ["open"];
        case "win32":
            return ["cmd", ["/c", "start"]];
        default:
            throw new Error(`Platform ${platform} isn't supported.`);
    }
};

/**
 * Opens the given URL in the default browser.
 * @param {string} url URL to open.
 * @returns {Promise<void>}
 */
async function openBrowser(url) {
    const [command, args = []] = commands();
    let cmd = Array.isArray(command) ? command[0] : command;
    execFileSync(cmd, [...args, encodeURI(url)]);
}

export { openBrowser };
