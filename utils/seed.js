require('dotenv').config();
const sequelize = require('../models/database');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Item = require('../models/Item');
const ProductImage = require('../models/ProductImage');
const Category = require('../models/Category');
const OrderInfo = require('../models/OrderInfo');
const OrderLine = require('../models/OrderLine');
const Review = require('../models/Review');

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('DB connected — seeding data...');

    // --- 1. Seed users ---
    const users = [
      { email: 'Fritzie@gmail.com', password: 'AdminPassword', role: 'admin' },
      { email: 'Lorraine@gmail.com', password: 'AdminPassword', role: 'admin' },
      { email: 'UserTest@gmail.com', password: 'CustomerPassword', role: 'user' },
      { email: 'cust1@gmail.com', password: 'CustPassword', role: 'user' },
      { email: 'cust2@gmail.com', password: 'CustPassword', role: 'user' },
      { email: 'mark.admin@gmail.com', password: 'AdminPassword123', role: 'admin' },
      { email: 'alice.smith@gmail.com', password: 'CustPassword123', role: 'user' },
      { email: 'bob.j@gmail.com', password: 'CustPassword123', role: 'user' },
      { email: 'charlie.b@gmail.com', password: 'CustPassword123', role: 'user' },
      { email: 'diana.p@gmail.com', password: 'CustPassword123', role: 'user' },
      { email: 'evan.w@gmail.com', password: 'CustPassword123', role: 'user' },
      { email: 'fiona.g@gmail.com', password: 'CustPassword123', role: 'user' },
      { email: 'george.c@gmail.com', password: 'CustPassword123', role: 'user' },
      { email: 'hannah.a@gmail.com', password: 'CustPassword123', role: 'user' },
      { email: 'ian.m@gmail.com', password: 'CustPassword123', role: 'user' }
    ];

    const userByEmail = {};
    for (const u of users) {
      const [user, created] = await User.findOrCreate({ where: { email: u.email }, defaults: u });
      if (!created) await user.update({ password: u.password, role: u.role, active: true });
      console.log(`${created ? 'Created' : 'Updated'} user: ${user.email} (${user.role})`);
      userByEmail[u.email] = user;
    }

    // --- 2. Seed Customer Profiles with realistic names & addresses ---
    // Keyed by the account email so order/review seeding below never depends on array position.
    const customerProfiles = {
      'UserTest@gmail.com': { title: 'Mr.', fname: 'Miguel', lname: 'Santos', addressline: 'Boni Avenue, Barangay Maldonado', town: 'Taguig City', zipcode: '1630', phone: '+63 917 555 1042' },
      'cust1@gmail.com': { title: 'Ms.', fname: 'Patricia', lname: 'Reyes', addressline: 'Kalayaan Avenue, Barangay Poblacion', town: 'Makati City', zipcode: '1210', phone: '+63 917 555 2087' },
      'cust2@gmail.com': { title: 'Mr.', fname: 'Joshua', lname: 'Cruz', addressline: 'Commonwealth Avenue, Barangay Batasan Hills', town: 'Quezon City', zipcode: '1126', phone: '+63 917 555 3311' },
      'alice.smith@gmail.com': { title: 'Ms.', fname: 'Alice', lname: 'Smith', addressline: 'Ortigas Avenue, Barangay San Antonio', town: 'Pasig City', zipcode: '1605', phone: '+63 917 555 4426' },
      'bob.j@gmail.com': { title: 'Mr.', fname: 'Bob', lname: 'Jimenez', addressline: 'Shaw Boulevard, Barangay Highway Hills', town: 'Mandaluyong City', zipcode: '1552', phone: '+63 917 555 5590' },
      'charlie.b@gmail.com': { title: 'Mr.', fname: 'Charlie', lname: 'Bautista', addressline: 'A. Mabini Street, Barangay 15', town: 'Caloocan City', zipcode: '1400', phone: '+63 917 555 6674' },
      'diana.p@gmail.com': { title: 'Ms.', fname: 'Diana', lname: 'Perez', addressline: 'EDSA, Barangay 76', town: 'Pasay City', zipcode: '1300', phone: '+63 917 555 7758' },
      'evan.w@gmail.com': { title: 'Mr.', fname: 'Evan', lname: 'Wong', addressline: 'Dr. A. Santos Avenue, Barangay Sun Valley', town: 'Parañaque City', zipcode: '1700', phone: '+63 917 555 8812' },
      'fiona.g@gmail.com': { title: 'Ms.', fname: 'Fiona', lname: 'Garcia', addressline: 'J.P. Rizal Street, Barangay Santo Niño', town: 'Marikina City', zipcode: '1800', phone: '+63 917 555 9903' },
      'george.c@gmail.com': { title: 'Mr.', fname: 'George', lname: 'Castillo', addressline: 'National Road, Barangay Alabang', town: 'Muntinlupa City', zipcode: '1770', phone: '+63 917 555 1128' },
      'hannah.a@gmail.com': { title: 'Ms.', fname: 'Hannah', lname: 'Aquino', addressline: 'N. Domingo Street, Barangay Little Baguio', town: 'San Juan City', zipcode: '1500', phone: '+63 917 555 2245' },
      'ian.m@gmail.com': { title: 'Mr.', fname: 'Ian', lname: 'Mendoza', addressline: 'Alabang-Zapote Road, Barangay Talon', town: 'Las Piñas City', zipcode: '1740', phone: '+63 917 555 3367' }
    };

    const customerIdMap = {}; // keyed by email, resolves to customer_id
    for (const [email, profile] of Object.entries(customerProfiles)) {
      const user = userByEmail[email];
      if (!user) continue;

      const customerPayload = {
        title: profile.title,
        fname: profile.fname,
        lname: profile.lname,
        addressline: profile.addressline,
        town: profile.town,
        zipcode: profile.zipcode,
        phone: profile.phone,
        user_id: user.id,
        image: 'uploads/profiles/default-avatar.png'
      };

      const [customer, created] = await Customer.findOrCreate({
        where: { user_id: user.id },
        defaults: customerPayload
      });

      if (!created) await customer.update(customerPayload);
      console.log(`${created ? 'Created' : 'Updated'} Customer Profile: ${customer.fname} ${customer.lname} (ID: ${customer.customer_id})`);

      customerIdMap[email] = customer.customer_id;
    }

    // --- 3. Seed categories ---
    const categories = [
      { category_id: 1, name: 'Brakes', description: 'Brake pads, rotors, and related safety parts.' },
      { category_id: 2, name: 'Fluids & Maintenance', description: 'Oils, fluids, filters, and cleaning products.' },
      { category_id: 3, name: 'Wheels & Drive', description: 'Tires, chains, and drivetrain essentials.' },
      { category_id: 4, name: 'Electrical', description: 'Batteries, spark plugs, and electrical components.' },
      { category_id: 5, name: 'Lighting', description: 'Headlights, bulbs, and lighting upgrades.' },
      { category_id: 6, name: 'Accessories', description: 'Practical accessories and security items.' },
      { category_id: 7, name: 'Suspension', description: 'Shocks, struts, and suspension upgrades.' }
    ];

    for (const category of categories) {
      const [record, created] = await Category.findOrCreate({ where: { category_id: category.category_id }, defaults: category });
      if (!created) await record.update(category);
      console.log(`${created ? 'Created' : 'Updated'} category: ${record.name}`);
    }

    // --- 4. Seed items — mapped to the actual files in /uploads/items ---
    // `images` lists every file that belongs to that product (in display order).
    // images[0] becomes Item.img_path (thumbnail); every file in `images` also
    // gets a row in product_images so a gallery view has the full set.
    const items = [
      {
        name: 'Brake Caliper',
        description: 'Precision-machined brake caliper for improved stopping power and heat dissipation.',
        cost_price: 1800, sell_price: 2600, supplier_name: 'MotoSupply Co.', category_id: 1, quantity: 30,
        images: ['Brake Caliper.jpg', 'Brake Caliper 2.jpg', 'Brake Caliper 3.jpg']
      },
      {
        name: 'Brake Fluid',
        description: 'DOT 3 hydraulic brake fluid formulated for consistent pedal feel and corrosion resistance.',
        cost_price: 150, sell_price: 240, supplier_name: 'OilMasters', category_id: 2, quantity: 100,
        images: ['Brake Fluid.jpg', 'brake fluid 2.jpg']
      },
      {
        name: 'Brake Light LED',
        description: 'High-visibility LED brake light bulb for faster reaction warning to trailing traffic.',
        cost_price: 180, sell_price: 320, supplier_name: 'LightTech', category_id: 5, quantity: 75,
        images: ['Brake Light LED.jpg']
      },
      {
        name: 'Brake Pad',
        description: 'Durable semi-metallic brake pad set built for consistent bite in wet and dry conditions.',
        cost_price: 500, sell_price: 750, supplier_name: 'MotoSupply Co.', category_id: 1, quantity: 100,
        images: ['Brake Pad.jpg', 'Brake Pad 2.jpg']
      },
      {
        name: 'CNC Bolts',
        description: 'Anodized CNC-machined bolt set for a lightweight, custom-finished look.',
        cost_price: 220, sell_price: 380, supplier_name: 'AeroParts', category_id: 6, quantity: 90,
        images: ['CNC Bolts.jpg', 'CNC Bolts 1.jpg']
      },
      {
        name: 'Radiator Coolant',
        description: 'Long-life radiator coolant that protects against overheating and internal corrosion.',
        cost_price: 160, sell_price: 260, supplier_name: 'OilMasters', category_id: 2, quantity: 85,
        images: ['Radiator Coolant.jpg', 'coolant 2.jpg']
      },
      {
        name: 'Electronic Control Unit (ECU)',
        description: 'Programmable ECU module that fine-tunes fuel and ignition mapping for better throttle response.',
        cost_price: 4200, sell_price: 6200, supplier_name: 'PowerMax', category_id: 4, quantity: 15,
        images: ['Electronic Control Unit (ECU).jpg', 'Electronil Control Unit 2.jpg']
      },
      {
        name: 'Shell Advance Engine Oil',
        description: 'Fully synthetic motorcycle engine oil designed for smooth performance under high heat.',
        cost_price: 320, sell_price: 480, supplier_name: 'OilMasters', category_id: 2, quantity: 60,
        images: ['Shell Advance Engine Oil.jpg', 'engine oil 2.jpg']
      },
      {
        name: 'Front Wheel Suspension',
        description: 'Adjustable front fork suspension kit for sharper handling and a smoother ride over rough roads.',
        cost_price: 2600, sell_price: 3800, supplier_name: 'SuspensionPro', category_id: 7, quantity: 20,
        images: ['Front Wheel Suspension.png', 'Front Wheel Suspension 1.png']
      },
      {
        name: 'Honda Stock Disc Brake',
        description: 'OEM-spec Honda disc brake rotor built as a direct factory replacement.',
        cost_price: 950, sell_price: 1400, supplier_name: 'MotoSupply Co.', category_id: 1, quantity: 40,
        images: ['Honda Stock Disc Brake.jpg', 'Honda Stock Disc Brake 2.jpg', 'Honda Stock Disc Brake 3.jpg']
      },
      {
        name: 'Mag Wheels',
        description: 'Lightweight cast magnesium-alloy wheel set for improved handling and a sportier stance.',
        cost_price: 3200, sell_price: 4600, supplier_name: 'WheelWorks', category_id: 3, quantity: 18,
        images: ['Mag Wheels.png', 'Mag wheels 2.jpg']
      },
      {
        name: 'Magneto Starter Coil',
        description: 'Replacement magneto starter coil that restores reliable ignition spark and charging output.',
        cost_price: 850, sell_price: 1300, supplier_name: 'PowerMax', category_id: 4, quantity: 35,
        images: ['Magneto Starter Coil.jpg', 'Magneto Starter 2.jpg']
      },
      {
        name: 'Motolite Motorcycle Battery',
        description: 'Maintenance-free Motolite battery delivering dependable cold-cranking power.',
        cost_price: 1600, sell_price: 2300, supplier_name: 'PowerMax', category_id: 4, quantity: 45,
        images: ['Motolite Motorcycle Battery.jpg', 'Motolite 2.jpg']
      },
      {
        name: 'Motorcycle Headlight',
        description: 'Direct-fit headlight assembly with a crisp beam pattern for better night visibility.',
        cost_price: 750, sell_price: 1150, supplier_name: 'LightTech', category_id: 5, quantity: 40,
        images: ['Motorcycle Headlight.jpg', 'Motorcycle Headlight 2.jpg']
      },
      {
        name: 'Motorcycle Tail Light',
        description: 'Bright, weatherproof tail light unit that keeps you visible to traffic behind.',
        cost_price: 280, sell_price: 450, supplier_name: 'LightTech', category_id: 5, quantity: 55,
        images: ['Motorcycle Tail light.jpg']
      },
      {
        name: 'Motorcycle Top Box',
        description: 'Weatherproof rear top box with a keyed lock for secure, extra storage space.',
        cost_price: 1400, sell_price: 2100, supplier_name: 'MotoSecure', category_id: 6, quantity: 30,
        images: ['Motorcycle Top Box.jpg', 'Motorcycle Top Box 1.jpg', 'Motorcycle Top Box 2.jpg']
      },
      {
        name: 'Rear Suspension',
        description: 'Gas-charged rear suspension unit with adjustable preload for a firmer, controlled ride.',
        cost_price: 2800, sell_price: 3900, supplier_name: 'SuspensionPro', category_id: 7, quantity: 20,
        images: ['Rear Suspension.png', 'Rear Suspension .1.png']
      },
      {
        name: 'Rim Wheels',
        description: 'Reinforced alloy rim wheel set built to handle daily city and highway riding.',
        cost_price: 2200, sell_price: 3200, supplier_name: 'WheelWorks', category_id: 3, quantity: 25,
        images: ['Rim Wheels.jpg', 'Rim Wheels 2.jpg']
      },
      {
        name: 'Side Mirror',
        description: 'Adjustable side mirror pair offering a wide rearview field and vibration-resistant mounting.',
        cost_price: 320, sell_price: 520, supplier_name: 'AeroParts', category_id: 6, quantity: 65,
        images: ['Side Mirror.jpg', 'side mirror 2.jpg']
      },
      {
        name: 'Wheel Tire (Diablo Rosso)',
        description: 'Pirelli Diablo Rosso sport tire delivering strong grip for spirited cornering.',
        cost_price: 3800, sell_price: 5200, supplier_name: 'WheelWorks', category_id: 3, quantity: 20,
        images: ['Wheel Tire (Diablo Rosso).jpg']
      }
    ];

    const itemIdMap = {}; // keyed by item name
    for (const i of items) {
      const { images, ...itemFields } = i;
      itemFields.img_path = `uploads/items/${images[0]}`;

      const [item, created] = await Item.findOrCreate({ where: { name: i.name }, defaults: itemFields });
      if (!created) await item.update(itemFields);
      console.log(`${created ? 'Created' : 'Updated'} item: ${item.name} (${images.length} image${images.length > 1 ? 's' : ''})`);

      itemIdMap[i.name] = item.id;

      // Seed the full gallery for this item, including the primary/thumbnail image.
      for (const filename of images) {
        const [, imgCreated] = await ProductImage.findOrCreate({
          where: { item_id: item.id, filename },
          defaults: { item_id: item.id, filename }
        });
        if (imgCreated) console.log(`  + gallery image: ${filename}`);
      }
    }

    // --- 5. Seed orders (keyed by customer email, resolved through customerIdMap) ---
    const orders = [
      { customerEmail: 'cust1@gmail.com',      date_placed: '2026-07-01', date_shipped: '2026-07-03', shipping: 150.00, status: 'Shipped' },
      { customerEmail: 'cust2@gmail.com',      date_placed: '2026-07-02', date_shipped: null,          shipping: 200.00, status: 'Processing' },
      { customerEmail: 'alice.smith@gmail.com',date_placed: '2026-07-03', date_shipped: '2026-07-04', shipping: 120.00, status: 'Shipped' },
      { customerEmail: 'bob.j@gmail.com',      date_placed: '2026-07-03', date_shipped: null,          shipping: 150.00, status: 'Processing' },
      { customerEmail: 'charlie.b@gmail.com',  date_placed: '2026-07-04', date_shipped: '2026-07-05', shipping: 180.00, status: 'Shipped' },
      { customerEmail: 'diana.p@gmail.com',    date_placed: '2026-07-04', date_shipped: null,          shipping: 0.00,   status: 'Shipped' },
      { customerEmail: 'evan.w@gmail.com',     date_placed: '2026-07-05', date_shipped: null,          shipping: 250.00, status: 'Processing' },
      { customerEmail: 'fiona.g@gmail.com',    date_placed: '2026-07-05', date_shipped: null,          shipping: 100.00, status: 'Processing' },
      { customerEmail: 'george.c@gmail.com',   date_placed: '2026-07-05', date_shipped: null,          shipping: 130.00, status: 'Processing' },
      { customerEmail: 'hannah.a@gmail.com',   date_placed: '2026-07-05', date_shipped: null,          shipping: 140.00, status: 'Processing' },
      { customerEmail: 'ian.m@gmail.com',      date_placed: '2026-07-05', date_shipped: null,          shipping: 160.00, status: 'Cancelled' },
      { customerEmail: 'alice.smith@gmail.com',date_placed: '2026-07-06', date_shipped: null,          shipping: 90.00,  status: 'Processing' }
    ];

    const orderRecords = []; // parallel array; orderRecords[i] corresponds to orders[i]
    for (const o of orders) {
      const customer_id = customerIdMap[o.customerEmail];
      const payload = { customer_id, date_placed: o.date_placed, date_shipped: o.date_shipped, shipping: o.shipping, status: o.status };

      const [order, created] = await OrderInfo.findOrCreate({ where: { customer_id, date_placed: o.date_placed }, defaults: payload });
      if (!created) await order.update(payload);
      console.log(`${created ? 'Created' : 'Updated'} order for ${o.customerEmail} on ${o.date_placed}`);
      orderRecords.push(order);
    }

    // --- 6. Seed reviews (item + order + reviewer resolved by name/email, not index) ---
    const reviews = [
      { itemName: 'Brake Pad',              orderIndex: 0, userEmail: 'cust1@gmail.com',       rating: 5, comment: 'Brake pads feel solid and the stopping power improved immediately.' },
      { itemName: 'Brake Fluid',            orderIndex: 0, userEmail: 'cust1@gmail.com',       rating: 4, comment: 'Fluid arrived on time and the pedal feel is noticeably firmer.' },
      { itemName: 'Wheel Tire (Diablo Rosso)', orderIndex: 1, userEmail: 'cust2@gmail.com',    rating: 5, comment: 'Great grip and durable build for daily rides.' },
      { itemName: 'Motorcycle Headlight',   orderIndex: 3, userEmail: 'bob.j@gmail.com',       rating: 4, comment: 'The headlights are bright and easy to install.' },
      { itemName: 'Rear Suspension',        orderIndex: 6, userEmail: 'evan.w@gmail.com',      rating: 5, comment: 'The rear shock absorber made the ride much more stable.' }
    ];

    for (const review of reviews) {
      const item_id = itemIdMap[review.itemName];
      const user = userByEmail[review.userEmail];
      const orderinfo_id = orderRecords[review.orderIndex].orderinfo_id;

      const payload = {
        item_id,
        orderinfo_id,
        user_id: user.id,
        user_name: review.userEmail.split('@')[0],
        rating: review.rating,
        comment: review.comment,
        is_visible: true
      };

      const [record, created] = await Review.findOrCreate({ where: { item_id, user_id: user.id }, defaults: payload });
      if (!created) await record.update(payload);
      console.log(`${created ? 'Created' : 'Updated'} review for item "${review.itemName}"`);
    }

    // --- 7. Seed order lines (resolved by order index + item name) ---
    const orderLines = [
      { orderIndex: 0, itemName: 'Brake Pad', quantity: 2 },
      { orderIndex: 0, itemName: 'Brake Fluid', quantity: 1 },
      { orderIndex: 1, itemName: 'Wheel Tire (Diablo Rosso)', quantity: 4 },
      { orderIndex: 1, itemName: 'Motolite Motorcycle Battery', quantity: 1 },
      { orderIndex: 2, itemName: 'Honda Stock Disc Brake', quantity: 2 },
      { orderIndex: 2, itemName: 'CNC Bolts', quantity: 2 },
      { orderIndex: 3, itemName: 'Motorcycle Headlight', quantity: 2 },
      { orderIndex: 4, itemName: 'Mag Wheels', quantity: 1 },
      { orderIndex: 5, itemName: 'Radiator Coolant', quantity: 1 },
      { orderIndex: 6, itemName: 'Rear Suspension', quantity: 2 },
      { orderIndex: 7, itemName: 'Rim Wheels', quantity: 2 },
      { orderIndex: 8, itemName: 'Shell Advance Engine Oil', quantity: 3 },
      { orderIndex: 9, itemName: 'Motorcycle Top Box', quantity: 1 },
      { orderIndex: 10, itemName: 'Side Mirror', quantity: 1 }
    ];

    for (const ol of orderLines) {
      const orderinfo_id = orderRecords[ol.orderIndex].orderinfo_id;
      const item_id = itemIdMap[ol.itemName];
      const payload = { orderinfo_id, item_id, quantity: ol.quantity };

      const [line, created] = await OrderLine.findOrCreate({ where: { orderinfo_id, item_id }, defaults: payload });
      if (!created) await line.update(payload);
      console.log(`${created ? 'Created' : 'Updated'} order line: order ${orderinfo_id}, item "${ol.itemName}", qty ${ol.quantity}`);
    }

    console.log('Seeding complete. Order details database views are ready!');
    await sequelize.close();
  } catch (e) {
    console.error('Seeding failed:', e.message);
    process.exitCode = 1;
  }
}

if (require.main === module) seed();