$(document).ready(() => {

    /**
     * Creates a toast with the given message and is positive or negative depending on the success parameter.
     * 
     * @param {Boolean} success Controls whether the toast is positive or negative.
     * @param {String} message The message of the toast.
     */
    function toast(success, message) {
        // jquery makes it harder
        document.getElementById('toast-body').textContent = message;
        let icon = document.getElementById('toast-icon');
        let status = document.getElementById('toast-status');
        if (success) {
            icon.textContent = 'check_circle';
            icon.style.color = 'var(--success-green)';
            status.textContent = 'Success:';
        } else {
            icon.textContent = 'cancel';
            icon.style.color = 'var(--error-red)';
            status.textContent = 'Error:';
        }

        const liveToast = document.getElementById('live-toast');
        new bootstrap.Toast(liveToast).show();
    }
    window.toast = toast;
})