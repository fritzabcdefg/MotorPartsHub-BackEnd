require('dotenv').config();
const sequelize = require('../models/database');
const User = require('../models/User');
const Customer = require('../models/Customer'); // Integrated Customer Model
const Item = require('../models/Item');
const OrderInfo = require('../models/OrderInfo');
const OrderLine = require('../models/OrderLine');

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('DB connected — seeding data...');

    // --- 1. Seed users ---
    const users = [
      { name: 'Fritzie', email: 'Fritzie@gmail.com', password: 'AdminPassword', role: 'admin' },
      { name: 'Lorraine', email: 'Lorraine@gmail.com', password: 'AdminPassword', role: 'admin' },
      { name: 'User Test', email: 'UserTest@gmail.com', password: 'CustomerPassword', role: 'user' },
      { name: 'Customer One', email: 'cust1@gmail.com', password: 'CustPassword', role: 'user' },
      { name: 'Customer Two', email: 'cust2@gmail.com', password: 'CustPassword', role: 'user' },
      { name: 'Admin Mark', email: 'mark.admin@gmail.com', password: 'AdminPassword123', role: 'admin' },
      { name: 'Alice Smith', email: 'alice.smith@gmail.com', password: 'CustPassword123', role: 'user' },
      { name: 'Bob Johnson', email: 'bob.j@gmail.com', password: 'CustPassword123', role: 'user' },
      { name: 'Charlie Brown', email: 'charlie.b@gmail.com', password: 'CustPassword123', role: 'user' },
      { name: 'Diana Prince', email: 'diana.p@gmail.com', password: 'CustPassword123', role: 'user' },
      { name: 'Evan Wright', email: 'evan.w@gmail.com', password: 'CustPassword123', role: 'user' },
      { name: 'Fiona Gallagher', email: 'fiona.g@gmail.com', password: 'CustPassword123', role: 'user' },
      { name: 'George Clark', email: 'george.c@gmail.com', password: 'CustPassword123', role: 'user' },
      { name: 'Hannah Abbott', email: 'hannah.a@gmail.com', password: 'CustPassword123', role: 'user' },
      { name: 'Ian Malcolm', email: 'ian.m@gmail.com', password: 'CustPassword123', role: 'user' }
    ];
    
    const userRecords = [];
    for (const u of users) {
      const [user, created] = await User.findOrCreate({ where: { email: u.email }, defaults: u });
      if (!created) await user.update({ name: u.name, password: u.password, role: u.role, active: true });
      console.log(`${created ? 'Created' : 'Updated'} user: ${user.email} (${user.role})`);
      userRecords.push(user);
    }

    // --- 2. Seed Customer Credentials (Maps User Accounts to Profiles) ---
    // This populates the profile rows so your orderdetails view has data to JOIN against
    const customerIdMap = {}; 
    
    for (const user of userRecords) {
      if (user.role === 'user') {
        const nameParts = user.name.split(' ');
        const firstName = nameParts[0] || 'John';
        const lastName = nameParts[1] || 'Doe';

        const customerPayload = {
          title: 'Mr.',
          fname: firstName,
          lname: lastName,
          addressline: 'Boni Avenue, Barangay Maldonado',
          town: 'Taguig City',
          zipcode: '1630',
          phone: '+63 917 555 ' + Math.floor(1000 + Math.random() * 9000),
          user_id: user.id, // Links directly to the created auth row
          image: 'uploads/profiles/default-avatar.png'
        };

        const [customer, created] = await Customer.findOrCreate({ 
          where: { user_id: user.id }, 
          defaults: customerPayload 
        });

        if (!created) await customer.update(customerPayload);
        console.log(`${created ? 'Created' : 'Updated'} Customer Profile: ${customer.fname} ${customer.lname} (ID: ${customer.customer_id})`);
        
        // Save the resulting customer_id index tied to the user's database ID
        customerIdMap[user.id] = customer.customer_id;
      }
    }

    // --- 3. Seed items ---
    const items = [
      { name: 'Brake Pad', description: 'Durable brake pad', cost_price: 500, sell_price: 750, supplier_name: 'MotoSupply Co.', category_id: 1, quantity: 100, img_path: 'uploads/brakepad.jpg' },
      { name: 'Engine Oil', description: 'Synthetic engine oil 1L', cost_price: 300, sell_price: 450, supplier_name: 'OilMasters', category_id: 2, quantity: 50, img_path: 'uploads/engineoil.jpg' },
      { name: 'Motorcycle Tire', description: 'Tubeless tire 17 inch', cost_price: 1200, sell_price: 1800, supplier_name: 'WheelWorks', category_id: 3, quantity: 40, img_path: 'uploads/tire.jpg' },
      { name: 'Car Battery', description: '12V maintenance-free battery', cost_price: 3500, sell_price: 4800, supplier_name: 'PowerMax', category_id: 4, quantity: 25, img_path: 'uploads/battery.jpg' },
      { name: 'Iridium Spark Plug', description: 'High-performance spark plug for optimal ignition', cost_price: 150, sell_price: 250, supplier_name: 'ApexParts', category_id: 1, quantity: 200, img_path: 'uploads/sparkplug.jpg' },
      { name: 'DOT 4 Brake Fluid', description: 'Premium synthetic brake fluid 500ml', cost_price: 180, sell_price: 280, supplier_name: 'OilMasters', category_id: 2, quantity: 80, img_path: 'uploads/brakefluid.jpg' },
      { name: 'LED Headlight Bulb', description: 'Ultra-bright H4 LED headlight conversion kit', cost_price: 600, sell_price: 950, supplier_name: 'LightTech', category_id: 5, quantity: 60, img_path: 'uploads/headlight.jpg' },
      { name: 'Heavy-Duty Drive Chain', description: 'Gold O-Ring 520 drive chain 120 links', cost_price: 1400, sell_price: 2100, supplier_name: 'ChainMasters', category_id: 3, quantity: 35, img_path: 'uploads/chain.jpg' },
      { name: 'Premium Air Filter', description: 'High-flow replacement air filter element', cost_price: 250, sell_price: 400, supplier_name: 'MotoSupply Co.', category_id: 1, quantity: 90, img_path: 'uploads/airfilter.jpg' },
      { name: 'Rear Shock Absorber', description: 'Adjustable gas-charged rear suspension rear shock', cost_price: 2800, sell_price: 3900, supplier_name: 'SuspensionPro', category_id: 7, quantity: 20, img_path: 'uploads/shock.jpg' },
      { name: 'Carbon Side Mirrors', description: 'Sleek aerodynamic carbon-fiber side mirrors pair', cost_price: 450, sell_price: 700, supplier_name: 'AeroParts', category_id: 6, quantity: 45, img_path: 'uploads/mirrors.jpg' },
      { name: 'High-Flow Oil Filter', description: 'Spin-on performance engine oil filter extraction', cost_price: 120, sell_price: 200, supplier_name: 'OilMasters', category_id: 2, quantity: 150, img_path: 'uploads/oilfilter.jpg' },
      { name: 'Carburetors Cleaner Spray', description: 'Aerosol cleaner spray 400ml heavy solvent', cost_price: 180, sell_price: 300, supplier_name: 'CleanMoto', category_id: 2, quantity: 110, img_path: 'uploads/carbcleaner.jpg' },
      { name: 'Universal Helmet Lock', description: 'Frame-mounted anti-theft security helmet lock', cost_price: 200, sell_price: 350, supplier_name: 'MotoSecure', category_id: 6, quantity: 120, img_path: 'uploads/helmetlock.jpg' }
    ];

    const itemRecords = [];
    for (const i of items) {
      const [item, created] = await Item.findOrCreate({ where: { name: i.name }, defaults: i });
      if (!created) await item.update(i);
      console.log(`${created ? 'Created' : 'Updated'} item: ${item.name}`);
      itemRecords.push(item);
    }

    // --- 4. Seed orders ---
    // Now pulling customer_id from customerIdMap instead of using the raw user ID
    const orders = [
      { customer_id: customerIdMap[userRecords[3].id], date_placed: '2026-07-01', date_shipped: '2026-07-03', shipping: 150.00, status: 'Shipped' },
      { customer_id: customerIdMap[userRecords[4].id], date_placed: '2026-07-02', date_shipped: null, shipping: 200.00, status: 'Processing' },
      { customer_id: customerIdMap[userRecords[6].id], date_placed: '2026-07-03', date_shipped: '2026-07-04', shipping: 120.00, status: 'Shipped' },
      { customer_id: customerIdMap[userRecords[7].id], date_placed: '2026-07-03', date_shipped: null, shipping: 150.00, status: 'Processing' },
      { customer_id: customerIdMap[userRecords[8].id], date_placed: '2026-07-04', date_shipped: '2026-07-05', shipping: 180.00, status: 'Shipped' },
      { customer_id: customerIdMap[userRecords[9].id], date_placed: '2026-07-04', date_shipped: null, shipping: 0.00, status: 'Pending' },
      { customer_id: customerIdMap[userRecords[10].id], date_placed: '2026-07-05', date_shipped: null, shipping: 250.00, status: 'Processing' },
      { customer_id: customerIdMap[userRecords[11].id], date_placed: '2026-07-05', date_shipped: null, shipping: 100.00, status: 'Pending' },
      { customer_id: customerIdMap[userRecords[12].id], date_placed: '2026-07-05', date_shipped: null, shipping: 130.00, status: 'Processing' },
      { customer_id: customerIdMap[userRecords[13].id], date_placed: '2026-07-05', date_shipped: null, shipping: 140.00, status: 'Processing' },
      { customer_id: customerIdMap[userRecords[14].id], date_placed: '2026-07-05', date_shipped: null, shipping: 160.00, status: 'Pending' },
      { customer_id: customerIdMap[userRecords[6].id], date_placed: '2026-07-05', date_shipped: null, shipping: 90.00, status: 'Processing' }
    ];

    const orderRecords = [];
    for (const o of orders) {
      const [order, created] = await OrderInfo.findOrCreate({ where: { customer_id: o.customer_id, date_placed: o.date_placed }, defaults: o });
      if (!created) await order.update(o);
      console.log(`${created ? 'Created' : 'Updated'} order for customer ID ${o.customer_id} on ${o.date_placed}`);
      orderRecords.push(order);
    }

    // --- 5. Seed order lines ---
    const orderLines = [
      { orderinfo_id: orderRecords[0].orderinfo_id, item_id: itemRecords[0].id, quantity: 2 },
      { orderinfo_id: orderRecords[0].orderinfo_id, item_id: itemRecords[1].id, quantity: 1 },
      { orderinfo_id: orderRecords[1].orderinfo_id, item_id: itemRecords[2].id, quantity: 4 },
      { orderinfo_id: orderRecords[1].orderinfo_id, item_id: itemRecords[3].id, quantity: 1 },
      { orderinfo_id: orderRecords[2].orderinfo_id, item_id: itemRecords[4].id, quantity: 4 },
      { orderinfo_id: orderRecords[2].orderinfo_id, item_id: itemRecords[5].id, quantity: 2 },
      { orderinfo_id: orderRecords[3].orderinfo_id, item_id: itemRecords[6].id, quantity: 2 },
      { orderinfo_id: orderRecords[4].orderinfo_id, item_id: itemRecords[7].id, quantity: 1 },
      { orderinfo_id: orderRecords[5].orderinfo_id, item_id: itemRecords[8].id, quantity: 1 },
      { orderinfo_id: orderRecords[6].orderinfo_id, item_id: itemRecords[9].id, quantity: 2 },
      { orderinfo_id: orderRecords[7].orderinfo_id, item_id: itemRecords[10].id, quantity: 2 },
      { orderinfo_id: orderRecords[8].orderinfo_id, item_id: itemRecords[11].id, quantity: 3 },
      { orderinfo_id: orderRecords[9].orderinfo_id, item_id: itemRecords[12].id, quantity: 1 },
      { orderinfo_id: orderRecords[10].orderinfo_id, item_id: itemRecords[13].id, quantity: 1 }
    ];

    for (const ol of orderLines) {
      const [line, created] = await OrderLine.findOrCreate({ where: { orderinfo_id: ol.orderinfo_id, item_id: ol.item_id }, defaults: ol });
      if (!created) await line.update(ol);
      console.log(`${created ? 'Created' : 'Updated'} order line: order ${ol.orderinfo_id}, item ${ol.item_id}, qty ${ol.quantity}`);
    }

    console.log('Seeding complete. Order details database views are ready!');
    await sequelize.close();
  } catch (e) {
    console.error('Seeding failed:', e.message);
    process.exitCode = 1;
  }
}

if (require.main === module) seed();