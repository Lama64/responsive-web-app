$(document).ready(() => {

    /**
     * Open the help overlay when the page loads.
     */
    $("#help-overlay").fadeIn();

    /**
     * Open the help overlay when the ? button is pressed.
     */
    $("#open-help").on("click", () => {
        $("#help-overlay").fadeIn();
    });

    /**
     * Close the help overlay if the X button in the overlay is pressed.
     */
    $("#close-help").on("click", () => {
        $("#help-overlay").fadeOut();
    });

    /**
     * Close the help overlay on a click outside of the help overlay content.
     */
    $("#help-overlay").on("click", (event) => {
        if ($(event.target).is("#help-overlay")) {
            $("#help-overlay").fadeOut();
        }
    });
});