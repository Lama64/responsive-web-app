$(document).ready(() => {

    // overlay should be open on load
    $("#help-overlay").fadeIn();

    // open overlay
    $("#open-help").on("click", () => {
        $("#help-overlay").fadeIn();
    });

    // close overlay
    $("#close-help").on("click", () => {
        $("#help-overlay").fadeOut();
    });

    // close overlay on outside click
    $("#help-overlay").on("click", (event) => {
        if ($(event.target).is("#help-overlay")) {
            $("#help-overlay").fadeOut();
        }
    });
});