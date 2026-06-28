function initHeaderNav() {
  const stored = localStorage.getItem('user');
  const navCart = document.getElementById('navCart');
  const navAuth = document.getElementById('navAuth');
  const navDashboard = document.getElementById('navDashboard');
  if (!stored) {
    if (navAuth) {
      navAuth.textContent = 'Login';
      navAuth.href = 'login.html';
    }
    return;
  }

  let user;
  try {
    user = JSON.parse(stored);
  } catch (err) {
    console.error('Invalid user JSON in localStorage', err);
    return;
  }

  const isAdmin = user.role === 'admin';
  if (!isAdmin) {
    if (navDashboard && navDashboard.parentNode) {
      navDashboard.parentNode.removeChild(navDashboard);
    }
  }

  if (navAuth) {
    navAuth.textContent = 'Logout';
    navAuth.href = '#';
    navAuth.id = 'navLogout';
  }

  if (isAdmin) {
    if (navCart && navCart.parentNode) {
      navCart.parentNode.removeChild(navCart);
    }
    if (navDashboard && !document.querySelector('.admin-links')) {
      const adminLinks = document.createElement('span');
      adminLinks.className = 'admin-links';
      adminLinks.innerHTML = '\n      <a href="dashboard.html#users">Users</a>\n      <a href="dashboard.html#inventory">Inventory</a>\n      <a href="dashboard.html#orders">Orders</a>';
      navDashboard.parentNode.insertBefore(adminLinks, navDashboard.nextSibling);
    }
  }

  document.addEventListener('click', function (e) {
    if (e.target && (e.target.id === 'navLogout' || e.target.closest('#navLogout'))) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    }
  });
}

window.initHeaderNav = initHeaderNav;
