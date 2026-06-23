const express = require('express');
const cors = require('cors');
const multer = require('multer');
const upload = multer();
const fs = require('fs');
const path = require('path');

const sequelize = require('../models/database');
const Part = require('../models/Part');

const app = express();
const PORT = process.env.PORT || 4000;
app.use(express.static(path.join(__dirname, '../public')));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Try to use Sequelize + SQLite if available, otherwise fall back to in-memory store
let DataTypes, User;
let usingDb = false;
try {
	DataTypes = require('sequelize').DataTypes;

	User = sequelize.define('User', {
		name: { type: DataTypes.STRING, allowNull: false },
		email: { type: DataTypes.STRING, allowNull: false, unique: true },
		password: { type: DataTypes.STRING, allowNull: false },
		active: { type: DataTypes.BOOLEAN, defaultValue: true },
		token: { type: DataTypes.STRING, allowNull: true }
	});

	(async () => {
		try {
			await sequelize.sync();
			usingDb = true;
			console.log('Using SQLite database at', path.join(__dirname, '..', 'database.sqlite'));
		} catch (e) {
			console.warn('Sequelize sync failed, falling back to in-memory store:', e.message);
		}
	})();
} catch (err) {
	console.log('Sequelize not available; using in-memory store. Install sequelize and sqlite3 for persistence.');
}

// In-memory fallback
const users = [];
let nextUserId = 1;

// Helper functions that abstract storage (DB or in-memory)
async function findUserByEmail(email) {
	if (usingDb && User) return await User.findOne({ where: { email } });
	return users.find(u => u.email === email && u.active);
}

async function findUserById(id) {
	if (usingDb && User) return await User.findByPk(id);
	return users.find(u => u.id === id && u.active);
}

async function createUser({ name, email, password }) {
	if (usingDb && User) return await User.create({ name, email, password });
	const newUser = { id: nextUserId++, name, email, password, active: true };
	users.push(newUser);
	return newUser;
}

// Test route
app.get('/', (req, res) => {
	res.send('Server is running!');
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

	const token = `token-${usingDb ? user.id : user.id}-${Date.now()}`;
	if (usingDb && user.update) {
		await user.update({ token });
	} else {
		user.token = token;
	}

	return res.json({
		success: 'Login successful',
		token,
		user: { id: user.id, name: user.name, email: user.email }
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

	if (usingDb && user.update) {
		await user.update(updates);
	} else {
		Object.assign(user, updates);
	}

	return res.json({
		success: true,
		message: 'Profile updated successfully.',
		user: { id: user.id, name: user.name, email: user.email }
	});
});

app.delete('/api/v1/deactivate', async (req, res) => {
	const { email } = req.body;
	if (!email) return res.status(400).json({ message: 'Email is required.' });
	const user = await findUserByEmail(email);
	if (!user) return res.status(404).json({ message: 'User not found.' });

	if (usingDb && user.update) {
		await user.update({ active: false });
	} else {
		user.active = false;
	}

	return res.json({ success: true, message: 'User account deactivated.' });
});

app.get('/parts', async (req, res) => {
	try {
		const parts = await Part.findAll();
		res.json(parts);
	} catch (error) {
		res.status(500).json({ message: 'Unable to fetch parts.', error: error.message });
	}
});

app.post('/parts', async (req, res) => {
	try {
		const part = await Part.create(req.body);
		res.status(201).json(part);
	} catch (error) {
		res.status(400).json({ message: 'Unable to create part.', error: error.message });
	}
});

// Start server
app.listen(PORT, () => {
	console.log(`Server started at http://localhost:${PORT}`);
});
