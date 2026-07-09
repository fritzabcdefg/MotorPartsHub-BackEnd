// C:\MotorPartsHub-BackEnd\controllers\orderController.js
const db = require('../utils/db');
const { sendOrderReceiptEmail } = require('../utils/emailService');
const PDFDocument = require('pdfkit');

// Flat shipping fee applied to every order (₱200)
const SHIPPING_FEE = 200;

// ─────────────────────────────────────────────────────────
// PRIVATE HELPER: High-Fidelity PDF Layout Architect 
// ─────────────────────────────────────────────────────────
const generatePdfDocument = (doc, data) => {
  // Theme Color Configurations
  const primaryColor = '#a86bff'; // Accent Purple Brand Hue
  const darkTextColor = '#222222';
  const mutedTextColor = '#666666';
  const alternatingBg = '#fbf9ff';
  const lineBorderColor = '#e6def5';

  // --- HEADER ROW BRANDING ---
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(24).text('MotorPartsHub', 50, 50);
  doc.fillColor(mutedTextColor).font('Helvetica').fontSize(10).text('Official Order Invoice / Receipt Document', 50, 76);
  
  doc.fillColor(darkTextColor).font('Helvetica-Bold').fontSize(13).text('INVOICE STATEMENT', 400, 50, { align: 'right', width: 162 });
  doc.fillColor(mutedTextColor).font('Helvetica').fontSize(10).text(`Ref ID: #MPH-${data.orderId}`, 400, 66, { align: 'right', width: 162 });
  
  // Top Border Accent Line Separator
  doc.moveTo(50, 95).lineTo(562, 95).strokeColor(lineBorderColor).lineWidth(1).stroke();

  // --- TWO-COLUMN CUSTOMER METADATA METRICS ---
  let gridY = 115;
  
  // Left Column - Order Logistics
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('LOGISTICS TRACKING', 50, gridY);
  doc.fillColor(darkTextColor).font('Helvetica').fontSize(10).text('Current Status:', 50, gridY + 18);
  doc.fillColor(primaryColor).font('Helvetica-Bold').text(data.status.toUpperCase(), 125, gridY + 18);
  doc.fillColor(darkTextColor).font('Helvetica').text(`Date Placed: ${new Date(data.datePlaced).toLocaleDateString()}`, 50, gridY + 32);

  // Right Column - Shipping Context Destination
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('SHIPPING DESTINATION', 300, gridY);
  doc.fillColor(darkTextColor).font('Helvetica-Bold').fontSize(10).text(`${data.fname} ${data.lname}`, 300, gridY + 18);
  doc.fillColor(mutedTextColor).font('Helvetica').fontSize(9).text(`${data.address}`, 300, gridY + 32, { width: 262, lineGap: 2 });
  doc.text(`Contact: ${data.phone}`, 300, doc.y + 4);

  // Mid-Grid Splitter Line
  gridY = Math.max(doc.y + 15, gridY + 75);
  doc.moveTo(50, gridY).lineTo(562, gridY).strokeColor(lineBorderColor).stroke();

  // --- TABULAR MANIFEST TABLE STRUCTURE ---
  gridY += 15;
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(11).text('PURCHASED MANIFEST ITEMS BREAKDOWN', 50, gridY);
  
  gridY += 18;
  // Draw Solid Colored Table Row Header Box
  doc.rect(50, gridY, 512, 22).fill(primaryColor);
  
  // Column Text Alignments inside Table Bar
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
  doc.text('Item Part Description', 62, gridY + 6);
  doc.text('Qty', 310, gridY + 6, { width: 35, align: 'center' });
  doc.text('Unit Price', 365, gridY + 6, { width: 90, align: 'right' });
  doc.text('Subtotal Amount', 465, gridY + 6, { width: 90, align: 'right' });

  gridY += 22;
  doc.font('Helvetica').fontSize(9.5);
  
  data.items.forEach((item, index) => {
    const itemPrice = parseFloat(item.price);
    const itemQty = parseInt(item.quantity);
    const rowSubtotal = itemPrice * itemQty;

    // Background Tint for Alternating Matrix Items
    if (index % 2 === 1) {
      doc.rect(50, gridY, 512, 24).fill(alternatingBg);
    }

    doc.fillColor(darkTextColor);
    doc.text(item.name || 'Genuine Part Component', 62, gridY + 7, { width: 240, height: 12, ellipsis: true });
    doc.text(itemQty.toString(), 310, gridY + 7, { width: 35, align: 'center' });
    doc.text(`PHP ${itemPrice.toFixed(2)}`, 365, gridY + 7, { width: 90, align: 'right' });
    doc.text(`PHP ${rowSubtotal.toFixed(2)}`, 465, gridY + 7, { width: 90, align: 'right' });

    gridY += 24;
    // Underline divider rule between line-items
    doc.moveTo(50, gridY).lineTo(562, gridY).strokeColor(lineBorderColor).lineWidth(0.5).stroke();
  });

  // --- ISOLATED FINANCIAL SUMMARY CHARGE BOX ---
  gridY += 20;
  
  // Auto-overflow boundary protector mapping safeguard
  if (gridY > 680) { doc.addPage(); gridY = 50; }

  const summaryBoxWidth = 230;
  const summaryBoxX = 562 - summaryBoxWidth;
  
  // Outline Box frame mapping
  doc.rect(summaryBoxX, gridY, summaryBoxWidth, 76).strokeColor(lineBorderColor).lineWidth(1).stroke();
  
  doc.fillColor(mutedTextColor).font('Helvetica').fontSize(9.5);
  doc.text('Parts Subtotal:', summaryBoxX + 15, gridY + 12);
  doc.fillColor(darkTextColor).text(`PHP ${data.itemsTotal.toFixed(2)}`, summaryBoxX + 115, gridY + 12, { width: 100, align: 'right' });
  
  doc.fillColor(mutedTextColor).text('Flat Rate Shipping:', summaryBoxX + 15, gridY + 28);
  doc.fillColor(darkTextColor).text(`PHP ${data.shipping.toFixed(2)}`, summaryBoxX + 115, gridY + 28, { width: 100, align: 'right' });

  // Embedded Grand Total Block Highlight Pill
  doc.rect(summaryBoxX + 1, gridY + 46, summaryBoxWidth - 2, 29).fill(primaryColor);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10.5);
  doc.text('Total Charge (COD):', summaryBoxX + 15, gridY + 56);
  doc.text(`PHP ${data.total.toFixed(2)}`, summaryBoxX + 115, gridY + 56, { width: 100, align: 'right' });
  
  // Clean Stream Finalization
  doc.end();
};

// ─────────────────────────────────────────────────────────
// PRIVATE HELPER: Convert full order content into memory buffer
// ─────────────────────────────────────────────────────────
const getOrderPdfBuffer = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      generatePdfDocument(doc, data);
    } catch (err) { reject(err); }
  });
};

// ─────────────────────────────────────────────────────────
// PRIVATE HELPER: Reusable Database Order Data Aggregator
// ─────────────────────────────────────────────────────────
const getOrderCompleteData = (orderId, callback) => {
  const sqlOrder = `
    SELECT o.orderinfo_id, o.status, o.shipping, o.date_placed,
           c.fname, c.lname, c.addressline, c.town, c.zipcode, c.phone, u.email
    FROM orderinfo o JOIN customers c ON o.customer_id = c.customer_id JOIN users u ON u.id = c.user_id WHERE o.orderinfo_id = ?`;
  const sqlItems = `
    SELECT i.name AS name, ol.quantity AS quantity, i.sell_price AS price
    FROM orderline ol JOIN items i ON ol.item_id = i.id WHERE ol.orderinfo_id = ?`;

  db.query(sqlOrder, [orderId], (err, orderResults) => {
    if (err) return callback(err);
    if (!orderResults.length) return callback(new Error('Order not found'));
    db.query(sqlItems, [orderId], (err, itemResults) => {
      if (err) return callback(err);
      const order = orderResults[0];
      const itemsTotal = itemResults.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0);
      const shipping = parseFloat(order.shipping || 0);
      callback(null, {
        orderId: order.orderinfo_id, status: order.status, datePlaced: order.date_placed, email: order.email, fname: order.fname, lname: order.lname, phone: order.phone, zipcode: order.zipcode, address: `${order.addressline}, ${order.town} ${order.zipcode || ''}`, items: itemResults, itemsTotal, shipping, total: itemsTotal + shipping
      });
    });
  });
};

// ─────────────────────────────────────────────────────────
// ROUTE HANDLERS
// ─────────────────────────────────────────────────────────

const getAllOrders = (req, res) => {
  const sql = `
    SELECT o.orderinfo_id, o.status, o.date_placed, o.shipping, CONCAT(c.fname, ' ', c.lname) AS customer_name, IFNULL(SUM(ol.quantity * i.sell_price), 0) + IFNULL(o.shipping, 0) AS total
    FROM orderinfo o JOIN customers c ON o.customer_id = c.customer_id LEFT JOIN orderline ol ON ol.orderinfo_id = o.orderinfo_id LEFT JOIN items i ON i.id = ol.item_id
    GROUP BY o.orderinfo_id, o.status, o.date_placed, o.shipping, c.fname, c.lname ORDER BY o.date_placed DESC`;
  db.query(sql, (err, results) => { if (err) return res.status(500).json({ error: err.message }); res.json(results); });
};

const getOrderDetails = (req, res) => {
  const orderId = req.params.id;
  const sqlCustomer = `SELECT CONCAT(fname, ' ', lname) AS customerName, addressline AS shippingAddress, town, zipcode, phone FROM customers WHERE customer_id = (SELECT customer_id FROM orderinfo WHERE orderinfo_id = ?)`;
  const sqlItems = `SELECT i.id AS itemId, i.name AS itemName, i.sell_price AS itemPrice, ol.quantity AS qty, (ol.quantity * i.sell_price) AS subTotal FROM orderline ol JOIN items i ON ol.item_id = i.id WHERE ol.orderinfo_id = ?`;
  db.query(sqlCustomer, [orderId], (err, custResults) => {
    if (err) return res.status(500).json({ error: 'DB Error' });
    db.query(sqlItems, [orderId], (err, itemResults) => {
      if (err) return res.status(500).json({ error: 'DB Error' });
      res.json({ customer: custResults[0] || {}, items: itemResults });
    });
  });
};

const updateOrderStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Missing status' });

  const sql = `UPDATE orderinfo SET status = ? WHERE orderinfo_id = ?`;
  db.query(sql, [status, id], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB Error' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });

    getOrderCompleteData(id, async (err, data) => {
      if (!err && data) {
        try {
          const buffer = await getOrderPdfBuffer(data);
          const link = `http://localhost:4000/api/v1/orders/${id}/receipt/download`;
          
          await sendOrderReceiptEmail({
            orderId:  data.orderId,
            status:   data.status,
            email:    data.email,
            fname:    data.fname,
            lname:    data.lname,
            phone:    data.phone,
            zipcode:  data.zipcode,
            items:    data.items,
            itemsTotal: data.itemsTotal,
            shipping:   data.shipping,
            total:      data.total,
            address:    data.address,
            downloadLink: link,
            pdfBuffer:  buffer
          });
        } catch (emailErr) { console.error(emailErr); }
      }
    });

    res.json({ ok: true, id, status });
  });
};

const downloadReceiptPdf = (req, res) => {
  const orderId = req.params.id;
  getOrderCompleteData(orderId, (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed data resolution' });
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt-Order-${orderId}.pdf`);
    doc.pipe(res);
    generatePdfDocument(doc, data);
  });
};

const getDashboardStats = (req, res) => {
  const sql = `SELECT (SELECT COUNT(*) FROM orderinfo) AS totalOrders, (SELECT IFNULL(SUM(ol.quantity * i.sell_price),0) FROM orderline ol JOIN items i ON ol.item_id = i.id) AS totalRevenue`;
  db.query(sql, (err, results) => { if (err) return res.status(500).json({ error: 'DB Error' }); res.json(results[0] || {}); });
};

const getChartData = (req, res) => {
  db.query("SELECT status, COUNT(*) as count FROM orderinfo GROUP BY status", (err, results) => { if (err) return res.status(500).json({ error: 'DB Error' }); res.json(results); });
};

const getUserSpecificOrders = (req, res) => {
  // SECURE FALLBACK: Uses the token identity first, falls back to URL params/queries safely
  const userId = req.user?.id || req.params.userId || req.query.userId;
  if (!userId) return res.status(400).json({ error: 'User ID is required.' });
  
  const sql = `
    SELECT o.orderinfo_id, o.status, o.date_placed, o.date_shipped, IFNULL(SUM(ol.quantity * i.sell_price), 0) + IFNULL(o.shipping, 0) AS total
    FROM orderinfo o JOIN customers c ON o.customer_id = c.customer_id LEFT JOIN orderline ol ON ol.orderinfo_id = o.orderinfo_id LEFT JOIN items i ON i.id = ol.item_id
    WHERE c.user_id = ? GROUP BY o.orderinfo_id, o.status, o.date_placed, o.date_shipped, o.shipping ORDER BY o.date_placed DESC`;
  db.query(sql, [userId], (err, results) => { if (err) return res.status(500).json({ error: 'DB Error' }); res.json({ success: true, orders: results }); });
};

const createOrder = (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ success: false });

  const getCustomerSql = `SELECT c.customer_id, u.email, c.fname, c.lname, c.addressline, c.town, c.zipcode, c.phone FROM customers c JOIN users u ON u.id = c.user_id WHERE c.user_id = ?`;
  db.query(getCustomerSql, [userId], (err, custResults) => {
    if (err || !custResults.length) return res.status(500).json({ success: false });

    const customer = custResults[0];
    const itemIds = items.map(item => item.item_id);
    db.query(`SELECT id, name, quantity, sell_price FROM items WHERE id IN (?)`, [itemIds], (err, stockResults) => {
      if (err) return res.status(500).json({ success: false });

      const stockById = {};
      stockResults.forEach(row => { stockById[row.id] = row; });
      const itemsTotal = items.reduce((sum, item) => sum + (parseFloat(stockById[item.item_id].sell_price) * parseInt(item.quantity || 1)), 0);
      const orderTotal = itemsTotal + SHIPPING_FEE;

      db.query(`INSERT INTO orderinfo (customer_id, status, date_placed, shipping) VALUES (?, 'Processing', NOW(), ?)`, [customer.customer_id, SHIPPING_FEE], (err, orderResult) => {
        if (err) return res.status(500).json({ success: false });

        const newOrderId = orderResult.insertId;
        const orderLineValues = items.map(item => [newOrderId, item.item_id, parseInt(item.quantity || 1)]);
        
        db.query(`INSERT INTO orderline (orderinfo_id, item_id, quantity) VALUES ?`, [orderLineValues], (err) => {
          if (err) return res.status(500).json({ success: false });

          const decrementPromises = items.map(item => {
            return new Promise((resolve) => db.query(`UPDATE items SET quantity = quantity - ? WHERE id = ?`, [parseInt(item.quantity || 1), item.item_id], () => resolve()));
          });

          Promise.all(decrementPromises).finally(async () => {
            getOrderCompleteData(newOrderId, async (err, fullData) => {
              if (!err && fullData) {
                try {
                  const buffer = await getOrderPdfBuffer(fullData);
                  const link = `http://localhost:4000/api/v1/orders/${newOrderId}/receipt/download`;
                  
                  await sendOrderReceiptEmail({
                    orderId:  newOrderId,
                    status:   fullData.status,
                    email:    customer.email,
                    fname:    customer.fname,
                    lname:    customer.lname,
                    phone:    customer.phone,
                    zipcode:  customer.zipcode,
                    items:    items.map(item => ({ ...item, name: stockById[item.item_id]?.name, price: stockById[item.item_id]?.sell_price })),
                    itemsTotal, shipping: SHIPPING_FEE, total: orderTotal,
                    address:  `${customer.addressline}, ${customer.town} ${customer.zipcode || ''}`,
                    downloadLink: link,
                    pdfBuffer:  buffer
                  });
                } catch (e) { console.error(e); }
              }
            });
            return res.json({ success: true, orderId: newOrderId });
          });
        });
      });
    });
  });
};

// ─────────────────────────────────────────────────────────
// EXPORTS CENTRALIZATION BLOCK
// ─────────────────────────────────────────────────────────
module.exports = {
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  downloadReceiptPdf,
  getDashboardStats,
  getChartData,
  getUserSpecificOrders,
  createOrder
};