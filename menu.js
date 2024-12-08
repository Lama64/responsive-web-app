$(document).ready(() => {

    /**
     * Opens the Hamburger menu
     */
    $('#open-menu').on('click', () => {
        $('#menu').css('width', '400px');
    })

    /**
     * Closes the Hamburger menu
     */
    $('#close-menu').on('click', () => {
        $('#menu').css('width', 0);
    })
})