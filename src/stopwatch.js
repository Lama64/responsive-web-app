$(document).ready(() => {
    let elapsedTime = 0;
    window.stopwatchStarted = false;
    let timerInterval;

    /**
     * Updates the stopwatch display with the current elapsed time.
     */
    function updateDisplay() {
        let hours = String(Math.floor(elapsedTime / 3600)).padStart(2, '0');
        let minutes = String(Math.floor((elapsedTime % 3600) / 60)).padStart(2, '0');
        let seconds = String(elapsedTime % 60).padStart(2, '0');
        $('#time').text(`${hours}:${minutes}:${seconds}`);
    }

    /**
     * Toggles the stopwatch when the play / pause button is pressed.
     */
    $('#stopwatch-start').on('click', () => {
        toggleStopwatch();
    });

    /**
     * Starts the stopwatch, if it is stopped and stops it, if it is started.
     */
    function toggleStopwatch() {
        if (stopwatchStarted) {
            clearInterval(timerInterval);
            timerInterval = null;
            stopwatchStarted = false;
            $('#stopwatch-start').text('play_arrow');
        } else if (!timerInterval) {
            timerInterval = setInterval(() => {
                elapsedTime++;
                updateDisplay();
            }, 1000);
            stopwatchStarted = true;
            $('#stopwatch-start').text('pause');
        }
    }
    window.toggleStopwatch = toggleStopwatch;

    /**
     * Resets the stopwatch when the reset button is pressed.
     */
    $('#stopwatch-reset').on('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
        elapsedTime = 0;
        stopwatchStarted = false;
        $('#stopwatch-start').text('play_arrow');
        updateDisplay();
    })

    /**
     * Toggles the visibility of the stopwatch according to the state of the checkbox.
     */
    $('#stopwatch-checkbox').on('change', (event) => {
        if (event.target.checked) {
            $('#stopwatch').css('display', 'flex');
        } else {
            $('#stopwatch').css('display', 'none');
        }
    })
})