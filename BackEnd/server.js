const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for file uploads
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Connect MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/loginDB')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: String,
  password: String
});

const User = mongoose.model('User', userSchema);

// Memory Schema
const memorySchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  tags: [String],
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  fileName: String,
  fileContent: String
});

const Memory = mongoose.model('Memory', memorySchema);

// Register API
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send({ message: 'All fields required' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send({ message: 'Username already taken' });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();
    res.status(200).send({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).send({ message: 'Something went wrong' });
  }
});

// Login API
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(401).send({ message: 'Invalid credentials' });
    }
    res.status(200).send({ message: 'Login successful' });
  } catch (err) {
    res.status(500).send({ message: 'Something went wrong' });
  }
});

// Memory APIs

// Create a new memory
app.post('/api/memories', async (req, res) => {
  try {
    const memoryData = req.body;
    
    // Validate required fields
    if (!memoryData.id || !memoryData.title || !memoryData.description || 
        !memoryData.uploadedBy || memoryData.lat === undefined || memoryData.lng === undefined) {
      return res.status(400).send({ message: 'Missing required fields' });
    }

    const newMemory = new Memory(memoryData);
    await newMemory.save();
    
    res.status(201).send({ id: newMemory.id, message: 'Memory saved successfully' });
  } catch (err) {
    console.error('Error saving memory:', err);
    if (err.code === 11000) { // Duplicate key error
      return res.status(400).send({ message: 'Memory with this ID already exists' });
    }
    res.status(500).send({ message: 'Failed to save memory' });
  }
});

// Get all memories or filter by uploadedBy
app.get('/api/memories', async (req, res) => {
  try {
    const { uploadedBy } = req.query;
    
    let filter = {};
    if (uploadedBy) {
      filter.uploadedBy = uploadedBy;
    }

    const memories = await Memory.find(filter).sort({ createdAt: -1 });
    res.status(200).json(memories);
  } catch (err) {
    console.error('Error fetching memories:', err);
    res.status(500).send({ message: 'Failed to fetch memories' });
  }
});

// Get memory by ID
app.get('/api/memories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const memory = await Memory.findOne({ id: id });
    
    if (!memory) {
      return res.status(404).send({ message: 'Memory not found' });
    }
    
    res.status(200).json(memory);
  } catch (err) {
    console.error('Error fetching memory:', err);
    res.status(500).send({ message: 'Failed to fetch memory' });
  }
});

// Update memory
app.put('/api/memories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const memory = await Memory.findOneAndUpdate(
      { id: id }, 
      updateData, 
      { new: true }
    );
    
    if (!memory) {
      return res.status(404).send({ message: 'Memory not found' });
    }
    
    res.status(200).json(memory);
  } catch (err) {
    console.error('Error updating memory:', err);
    res.status(500).send({ message: 'Failed to update memory' });
  }
});

// Delete memory
app.delete('/api/memories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const memory = await Memory.findOneAndDelete({ id: id });
    
    if (!memory) {
      return res.status(404).send({ message: 'Memory not found' });
    }
    
    res.status(200).send({ message: 'Memory deleted successfully' });
  } catch (err) {
    console.error('Error deleting memory:', err);
    res.status(500).send({ message: 'Failed to delete memory' });
  }
});

// Search memories by location (within tolerance)
app.get('/api/memories/location/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { tolerance = 0.001 } = req.query;
    
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const toleranceNum = parseFloat(tolerance);

    const memories = await Memory.find({
      lat: { 
        $gte: latNum - toleranceNum, 
        $lte: latNum + toleranceNum 
      },
      lng: { 
        $gte: lngNum - toleranceNum, 
        $lte: lngNum + toleranceNum 
      }
    }).sort({ createdAt: -1 });

    res.status(200).json(memories);
  } catch (err) {
    console.error('Error searching memories by location:', err);
    res.status(500).send({ message: 'Failed to search memories by location' });
  }
});

// Search memories by tag
app.get('/api/memories/search/tag/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    
    const memories = await Memory.find({
      tags: { $regex: tag, $options: 'i' } // Case-insensitive search
    }).sort({ createdAt: -1 });

    res.status(200).json(memories);
  } catch (err) {
    console.error('Error searching memories by tag:', err);
    res.status(500).send({ message: 'Failed to search memories by tag' });
  }
});

// Get all unique tags
app.get('/api/tags', async (req, res) => {
  try {
    const result = await Memory.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags' } },
      { $sort: { _id: 1 } }
    ]);
    
    const tags = result.map(item => item._id);
    res.status(200).json(tags);
  } catch (err) {
    console.error('Error fetching tags:', err);
    res.status(500).send({ message: 'Failed to fetch tags' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));