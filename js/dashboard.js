// Dashboard base script
(function () {
    function init() {
        // Initialize dashboard widgets and charts here
        console.log('Dashboard initialized');
    }

    window.Dashboard = { init };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
