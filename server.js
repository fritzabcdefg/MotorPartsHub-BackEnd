const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const sequelize = require('./models/database');
const Part = require('./models/Part');
const Item = require('./models/Item');

const app = express();
const PORT = process.env.PORT || 4000;
app.use('/css', express.static(path.join(__dirname, '..', 'frontend', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'frontend', 'js')));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadPath = path.join(__dirname, '..', 'frontend', 'public', 'uploads');
if (!fs.existsSync(uploadPath)) {
	fs.mkdirSync(uploadPath, { recursive: true });
}
app.use('/uploads', express.static(uploadPath));

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, uploadPath),
	filename: (req, file, cb) => {
		const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_.]/g, '_');
		cb(null, `${Date.now()}-${safeName}`);
	}
});
const upload = multer({ storage });

// Configure Sequelize-backed User model and ensure DB is ready before starting server
const { DataTypes } = require('sequelize');

const User = sequelize.define('User', {
	name: { type: DataTypes.STRING, allowNull: false },
	email: { type: DataTypes.STRING, allowNull: false, unique: true },
	password: { type: DataTypes.STRING, allowNull: false },
	active: { type: DataTypes.BOOLEAN, defaultValue: true },
	role: { type: DataTypes.STRING, defaultValue: 'user' },
	token: { type: DataTypes.STRING, allowNull: true }
});

// Helper functions that operate against the Sequelize `User` model
async function findUserByEmail(email, includeInactive = false) {
	const whereClause = { email };
	if (!includeInactive) whereClause.active = true;
	return await User.findOne({ where: whereClause });
}

async function findUserById(id, includeInactive = false) {
	const user = await User.findByPk(id);
	if (!user) return null;
	if (!includeInactive && !user.active) return null;
	return user;
}

async function getAllUsers() {
	return await User.findAll();
}

async function createUser({ name, email, password, role = 'user' }) {
	return await User.create({ name, email, password, role });
}

async function findUserByToken(token, includeInactive = false) {
	const whereClause = { token };
	if (!includeInactive) whereClause.active = true;
	return await User.findOne({ where: whereClause });
}

// Test route
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'home.html'));
});

app.post('/api/v1/register', async (req, res) => {
	const { name, email, password } = req.body;
	if (!name || !email || !password) {
		return res.status(400).json({ message: 'Name, email, and password are required.' });
	}

	const existingUser = await findUserByEmail(email);
	if (existingUser) {
		return res.status(400).json({ message: 'Email is already registered.' });
	}

	const newUser = await createUser({ name, email, password });

	return res.status(201).json({
		success: true,
		message: 'Register success',
		user: { id: newUser.id, name: newUser.name, email: newUser.email }
	});
});

app.post('/api/v1/login', async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return res.status(400).json({ message: 'Email and password are required.' });
	}

	const user = await findUserByEmail(email);
	if (!user || user.password !== password || !user.active) {
		return res.status(401).json({ message: 'Invalid email or password.' });
	}

	const token = `token-${user.id}-${Date.now()}`;
	await user.update({ token });

	return res.json({
		success: 'Login successful',
		token,
		user: { id: user.id, name: user.name, email: user.email, role: user.role }
	});
});

app.post('/api/v1/update-profile', upload.single('avatar'), async (req, res) => {
	const userId = Number(req.body.userId);
	if (!userId) return res.status(400).json({ message: 'userId is required.' });
	const user = await findUserById(userId);
	if (!user) return res.status(404).json({ message: 'User not found.' });

	const updates = {};
	if (req.body.name) updates.name = req.body.name;
	if (req.body.email) updates.email = req.body.email;
	if (req.body.password) updates.password = req.body.password;

	await user.update(updates);

	return res.json({
		success: true,
		message: 'Profile updated successfully.',
		user: { id: user.id, name: user.name, email: user.email }
	});
});

// Middleware to verify admin role
async function verifyAdmin(req, res, next) {
	const token = req.headers.authorization?.split(' ')[1];
	if (!token) return res.status(401).json({ message: 'No token provided.' });

	const user = await findUserByToken(token);
	if (!user) return res.status(401).json({ message: 'Invalid or expired token.' });
	if (user.role !== 'admin') return res.status(403).json({ message: 'Admin role required.' });

	req.user = user;
	next();
}

// Get all users (admin only)
app.get('/api/v1/users', verifyAdmin, async (req, res) => {
	try {
		const allUsers = await getAllUsers();
		const userList = allUsers.map(u => ({
			id: u.id,
			name: u.name,
			email: u.email,
			role: u.role || 'user',
			active: u.active
		}));
		res.json({ success: true, users: userList });
	} catch (error) {
		res.status(500).json({ message: 'Unable to fetch users.', error: error.message });
	}
});

app.get('/api/v1/parts', verifyAdmin, async (req, res) => {
	try {
		const parts = await Part.findAll();
		res.json({ success: true, parts });
	} catch (error) {
		res.status(500).json({ message: 'Unable to fetch parts.', error: error.message });
	}
});

// Items API (mp2) - public listing for storefront and admin CRUD
app.get('/api/v1/items', async (req, res) => {
	try {
		const items = await Item.findAll();
		// Provide a `rows` shape used by the existing homepage script
		const rows = items.map(i => ({
			item_id: i.id,
			description: i.description || i.name,
			sell_price: i.sell_price,
			img_path: i.img_path || '',
			quantity: i.quantity
		}));
		res.json({ rows });
	} catch (error) {
		console.error('GET /api/v1/items error:', error.stack || error.message);
		res.status(500).json({ message: 'Unable to fetch items.', error: error.message });
	}
});

app.get('/api/v1/items/:id', async (req, res) => {
	try {
		const item = await Item.findByPk(req.params.id);
		if (!item) return res.status(404).json({ message: 'Item not found.' });
		res.json(item);
	} catch (error) {
		console.error('GET /api/v1/items/:id error:', error.stack || error.message);
		res.status(500).json({ message: 'Unable to fetch item.', error: error.message });
	}
});

// Admin CRUD for items
app.post('/api/v1/items', verifyAdmin, upload.single('image'), async (req, res) => {
	try {
		const img = req.file ? `/uploads/${req.file.filename}` : null;
		const item = await Item.create({
			name: req.body.name,
			description: req.body.description,
			sell_price: parseFloat(req.body.sell_price) || 0,
			quantity: parseInt(req.body.quantity, 10) || 0,
			img_path: img
		});
		res.status(201).json({ success: true, item });
	} catch (error) {
		console.error('POST /api/v1/items error:', error.stack || error.message);
		res.status(400).json({ message: 'Unable to create item.', error: error.message });
	}
});

app.put('/api/v1/items/:id', verifyAdmin, upload.single('image'), async (req, res) => {
	try {
		const item = await Item.findByPk(req.params.id);
		if (!item) return res.status(404).json({ message: 'Item not found.' });
		const img = req.file ? `/uploads/${req.file.filename}` : item.img_path;
		await item.update({
			name: req.body.name || item.name,
			description: req.body.description || item.description,
			sell_price: req.body.sell_price ? parseFloat(req.body.sell_price) : item.sell_price,
			quantity: req.body.quantity ? parseInt(req.body.quantity, 10) : item.quantity,
			img_path: img
		});
		res.json({ success: true, message: 'Item updated.', item });
	} catch (error) {
		console.error('PUT /api/v1/items/:id error:', error.stack || error.message);
		res.status(400).json({ message: 'Unable to update item.', error: error.message });
	}
});

app.delete('/api/v1/items/:id', verifyAdmin, async (req, res) => {
	try {
		const item = await Item.findByPk(req.params.id);
		if (!item) return res.status(404).json({ message: 'Item not found.' });
		await item.destroy();
		res.json({ success: true, message: 'Item deleted.' });
	} catch (error) {
		console.error('DELETE /api/v1/items/:id error:', error.stack || error.message);
		res.status(500).json({ message: 'Unable to delete item.', error: error.message });
	}
});

app.post('/api/v1/parts', verifyAdmin, upload.array('images', 5), async (req, res) => {
	try {
		const images = req.files?.map(file => `/uploads/${file.filename}`) || [];
		const part = await Part.create({
			name: req.body.name,
			description: req.body.description,
			price: parseFloat(req.body.price) || 0,
			quantity: parseInt(req.body.quantity, 10) || 0,
			images: JSON.stringify(images)
		});
		res.status(201).json({ success: true, part });
	} catch (error) {
		console.error('POST /api/v1/parts error:', error.stack || error.message);
		res.status(400).json({ message: 'Unable to create part.', error: error.message });
	}
});

app.put('/api/v1/parts/:id', verifyAdmin, upload.array('images', 5), async (req, res) => {
	try {
		const part = await Part.findByPk(req.params.id);
		if (!part) return res.status(404).json({ message: 'Part not found.' });

		const images = req.files?.map(file => `/uploads/${file.filename}`);
		const updates = {
			name: req.body.name,
			description: req.body.description,
			price: parseFloat(req.body.price) || part.price,
			quantity: parseInt(req.body.quantity, 10) || part.quantity
		};
		if (images && images.length) {
			updates.images = JSON.stringify(images);
		}

		await part.update(updates);
		res.json({ success: true, message: 'Part updated.', part });
	} catch (error) {
		console.error('PUT /api/v1/parts/:id error:', error.stack || error.message);
		res.status(400).json({ message: 'Unable to update part.', error: error.message });
	}
});

app.delete('/api/v1/parts/:id', verifyAdmin, async (req, res) => {
	try {
		const part = await Part.findByPk(req.params.id);
		if (!part) return res.status(404).json({ message: 'Part not found.' });

		await part.destroy();
		res.json({ success: true, message: 'Part deleted.' });
	} catch (error) {
		console.error('DELETE /api/v1/parts/:id error:', error.stack || error.message);
		res.status(500).json({ message: 'Unable to delete part.', error: error.message });
	}
});

// Update user role (admin only)
app.put('/api/v1/users/:id/role', verifyAdmin, async (req, res) => {
	const userId = Number(req.params.id);
	const { role } = req.body;
	if (!role || !['user', 'admin'].includes(role)) {
		return res.status(400).json({ message: 'Valid role is required (user or admin).' });
	}

	const user = await findUserById(userId, true);
	if (!user) return res.status(404).json({ message: 'User not found.' });

	await user.update({ role });

	return res.json({ success: true, message: 'User role updated.', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Deactivate user (admin only)
app.delete('/api/v1/deactivate', verifyAdmin, async (req, res) => {
	const { email } = req.body;
	if (!email) return res.status(400).json({ message: 'Email is required.' });
	const user = await findUserByEmail(email, true);
	if (!user) return res.status(404).json({ message: 'User not found.' });

	await user.update({ active: false });

	return res.json({ success: true, message: 'User account deactivated.' });
});

app.get('/parts', async (req, res) => {
	try {
		const query = req.query.q;
		const where = {};
		if (query) {
			where.name = { [require('sequelize').Op.like]: `%${query}%` };
		}
		const parts = await Part.findAll({ where });
		res.json(parts);
	} catch (error) {
		console.error('GET /parts error:', error.stack || error.message);
		res.status(500).json({ message: 'Unable to fetch parts.', error: error.message });
	}
});

app.get('/parts/:id', async (req, res) => {
	try {
		const part = await Part.findByPk(req.params.id);
		if (!part) return res.status(404).json({ message: 'Part not found.' });
		res.json(part);
	} catch (error) {
		console.error('GET /parts/:id error:', error.stack || error.message);
		res.status(500).json({ message: 'Unable to fetch part.', error: error.message });
	}
});

app.post('/parts', verifyAdmin, async (req, res) => {
	try {
		const part = await Part.create(req.body);
		res.status(201).json(part);
	} catch (error) {
		console.error('POST /parts error:', error.stack || error.message);
		res.status(400).json({ message: 'Unable to create part.', error: error.message });
	}
});

app.put('/parts/:id', verifyAdmin, async (req, res) => {
	try {
		const part = await Part.findByPk(req.params.id);
		if (!part) return res.status(404).json({ message: 'Part not found.' });

		await part.update(req.body);
		res.json({ success: true, message: 'Part updated.', part });
	} catch (error) {
		console.error('PUT /parts/:id error:', error.stack || error.message);
		res.status(400).json({ message: 'Unable to update part.', error: error.message });
	}
});

app.delete('/parts/:id', verifyAdmin, async (req, res) => {
	try {
		const part = await Part.findByPk(req.params.id);
		if (!part) return res.status(404).json({ message: 'Part not found.' });

		await part.destroy();
		res.json({ success: true, message: 'Part deleted.' });
	} catch (error) {
		console.error('DELETE /parts/:id error:', error.stack || error.message);
		res.status(500).json({ message: 'Unable to delete part.', error: error.message });
	}
});

// Ensure DB is connected and synced, then start the server
(async () => {
	try {
		await sequelize.authenticate();
		await sequelize.sync();
		console.log(`Sequelize connected: dialect=${sequelize.getDialect()} host=${sequelize.options.host}:${sequelize.options.port} db=${sequelize.config.database}`);
		app.listen(PORT, () => {
			console.log(`Server started at http://localhost:${PORT}`);
		});
	} catch (e) {
		console.error('Failed to initialize database connection:', e.message);
		process.exit(1);
	}
})();
