const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import routes
const bracketRoutes = require('./routes/bracket');

// Create express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middlewares
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/bracket', bracketRoutes);

// Initialize bracket data file if it doesn't exist
const dataPath = path.join(__dirname, '../data');
const bracketFilePath = path.join(dataPath, 'bracket.json');

if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath);
}

if (!fs.existsSync(bracketFilePath)) {
  // Create initial bracket data with 16 participants (empty)
  const initialBracket = {
    rounds: [
      {
        name: "Huitièmes de finale",
        matches: Array.from({ length: 8 }, (_, i) => ({
          id: i + 1,
          teams: [
            { name: `Team ${i * 2 + 1}`, score: 0 },
            { name: `Team ${i * 2 + 2}`, score: 0 }
          ],
          winner: null,
          completed: false
        }))
      },
      {
        name: "Quarts de finale",
        matches: Array.from({ length: 4 }, (_, i) => ({
          id: i + 9,
          teams: [
            { name: null, score: 0 },
            { name: null, score: 0 }
          ],
          winner: null,
          completed: false
        }))
      },
      {
        name: "Demi-finales",
        matches: Array.from({ length: 2 }, (_, i) => ({
          id: i + 13,
          teams: [
            { name: null, score: 0 },
            { name: null, score: 0 }
          ],
          winner: null,
          completed: false
        }))
      },
      {
        name: "Finale",
        matches: [
          {
            id: 15,
            teams: [
              { name: null, score: 0 },
              { name: null, score: 0 }
            ],
            winner: null,
            completed: false
          }
        ]
      }
    ]
  };

  fs.writeFileSync(bracketFilePath, JSON.stringify(initialBracket, null, 2));
  console.log('Initial bracket data created.');
}

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Emit current bracket data when client connects
  const bracketData = JSON.parse(fs.readFileSync(bracketFilePath, 'utf8'));
  socket.emit('bracketUpdate', bracketData);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Socket middleware for real-time updates
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
