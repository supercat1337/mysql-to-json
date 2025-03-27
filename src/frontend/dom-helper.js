// @ts-check

/**
 * Delegates an event to a specified target element within an ancestor element.
 *
 * @param {string} event_type - The type of event to listen for (e.g., "click").
 * @param {HTMLElement} ancestor_element - The ancestor element to delegate the event from.
 * @param {string} target_element_selector - The CSS selector for the target element the event should be delegated to.
 * @param {Function} listener_function - The function to execute when the event is triggered on the target element.
 */
export function delegate_event(
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
export function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
