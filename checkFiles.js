const fs = require('fs');
const path = require('path');

const required = [
  'package.json',
  path.join('css','style.css'),
  path.join('html','home.html'),
  path.join('html','item.html'),
  path.join('html','cart.html'),
  path.join('html','login.html'),
  path.join('html','register.html'),
  path.join('html','profile.html'),
  path.join('html','dashboard.html'),
  path.join('js','server.js'),
  path.join('js','user.js')
];

const missing = required.filter(p => !fs.existsSync(path.resolve(p)));
if (missing.length === 0) {
  console.log('All required files are present.');
  process.exit(0);
} else {
  console.error('Missing files:');
  missing.forEach(m => console.error(' -', m));
  process.exit(2);
}
