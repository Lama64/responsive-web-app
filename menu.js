$(document).ready(() => {

    /**
     * Opens the slideover menu
     */
    $('.open-menu').on('click', () => {
        let screenWidth = window.innerWidth;
        let menuWidth = screenWidth < 400 ? screenWidth : 400;
        $('#menu').css('width', menuWidth);
    })

    /**
     * Closes the slideover menu
     */
    $('#close-menu').on('click', () => {
        $('#menu').css('width', 0);
    })
})