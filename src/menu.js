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

    /**
     * Adds a new zone to the menu zone list.
     * 
     * @param {String} zone The name of the zone to add.
     */
    function addToMenuZonesList(zone) {
        let listItem = $('<li></li>').text(zone);
        let deleteButton = $('<span class="material-symbols-outlined"></span>')
            .text('delete').on('click', function () {
                $(this).parent().remove();
                deleteZone(zone);
            });
        listItem.append(deleteButton);
        $('#zones-list').append(listItem);
    }
    window.addToMenuZonesList = addToMenuZonesList;
})