$(document).ready(() => {

    /**
     * Opens the slideover menu
     */
    $('.open-menu').on('click', () => {
        let screenWidth = window.innerWidth;
        let screenHeight = window.innerHeight;
        if (screenWidth < 400) {
            menuWidth = screenWidth;
        } else if (screenHeight < 400) {
            menuWidth = screenHeight;
        } else menuWidth = 400;
        $('#menu').css('width', menuWidth);
    })

    /**
     * Closes the slideover menu
     */
    $('#close-menu').on('click', () => {
        $('#menu').css('width', 0);
    })
})