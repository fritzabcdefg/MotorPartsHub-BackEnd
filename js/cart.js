// Base cart utilities for MotorPartsHub
(function (global) {
    const CART_KEY = 'mph_cart_v1';

    function getCart() {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }

    function addItem(item) {
        const cart = getCart();
        const existing = cart.find(i => i.item_id === item.item_id);
        if (existing) existing.quantity = (existing.quantity || 0) + (item.quantity || 1);
        else cart.push(Object.assign({}, item, { quantity: item.quantity || 1 }));
        saveCart(cart);
        return cart;
    }

    function removeItem(itemId) {
        let cart = getCart();
        cart = cart.filter(i => i.item_id !== itemId);
        saveCart(cart);
        return cart;
    }

    global.Cart = { getCart, saveCart, addItem, removeItem };
})(window);
