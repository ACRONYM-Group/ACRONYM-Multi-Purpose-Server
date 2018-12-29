const remote = require('electron').remote;

function test() {
    console.log("Hello");
}

//(function handleWindowControls() {
    /* When document has loaded, initialise
    document.onreadystatechange = () => {
        if (document.readyState == "complete") {
            init();
        }
    };*/

    function init() {
        let window = remote.getCurrentWindow();
        const minButton = document.getElementById('MinButton'),
            maxButton = document.getElementById('MaxButton'),
            restoreButton = document.getElementById('RestoreButton'),
            closeButton = document.getElementById('CloseButton');

        minButton.addEventListener("click", event => {
            window = remote.getCurrentWindow();
            window.minimize();
        });

        maxButton.addEventListener("click", event => {
            window = remote.getCurrentWindow();
            window.maximize();
            toggleMaxRestoreButtons();
            console.log("hello");
        });

        restoreButton.addEventListener("click", event => {
            window = remote.getCurrentWindow();
            window.unmaximize();
            toggleMaxRestoreButtons();
        });

        // Toggle maximise/restore buttons when maximisation/unmaximisation
        // occurs by means other than button clicks e.g. double-clicking
        // the title bar:
        toggleMaxRestoreButtons();
        window.on('maximize', toggleMaxRestoreButtons);
        window.on('unmaximize', toggleMaxRestoreButtons);

        closeButton.addEventListener("click", event => {
            window = remote.getCurrentWindow();
            window.close();
        });

        function toggleMaxRestoreButtons() {
            window = remote.getCurrentWindow();
            if (window.isMaximized()) {
                maxButton.style.display = "none";
                restoreButton.style.display = "flex";
            } else {
                restoreButton.style.display = "none";
                maxButton.style.display = "flex";
            }
        }
    }

module.exports.init = init;
//})();