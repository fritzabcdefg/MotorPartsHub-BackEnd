// User auth helper stubs
(function (global) {
    function login(credentials) {
        // placeholder: call API to authenticate
        console.log('login', credentials);
        return Promise.resolve({ ok: true });
    }

    function register(data) {
        console.log('register', data);
        return Promise.resolve({ ok: true });
    }

    function profile() {
        // return cached profile or fetch
        return null;
    }

    global.User = { login, register, profile };
})(window);
