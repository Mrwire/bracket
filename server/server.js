const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

// Run initialization script
require('./initBracket');

// Create express app
const app = express();
const server = http.createServer(app);

// Define data path
const dataPath = path.join(__dirname, 'data');
const bracketFilePath = path.join(dataPath, 'bracket.json');

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for image data URIs
app.use(express.static(path.join(__dirname, '../client')));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Tournament Bracket API',
  customfavIcon: '../client/favicon.ico'
}));

// Ensure all teams have the image property
function ensureTeamImages(bracketData) {
  // Make sure we have a participants array
  if (!bracketData.participants) {
    bracketData.participants = [];
  }

  // Process all teams in all matches
  bracketData.rounds.forEach(round => {
    round.matches.forEach(match => {
      match.teams.forEach(team => {
        if (team.name && team.image === undefined) {
          team.image = null;
        }
      });
    });
  });

  return bracketData;
}

// API Routes

// GET /api/bracket - Get the entire bracket structure
app.get('/api/bracket', (req, res) => {
  try {
    let bracketData = JSON.parse(fs.readFileSync(bracketFilePath, 'utf8'));
    bracketData = ensureTeamImages(bracketData);
    return res.json(bracketData);
  } catch (error) {
    console.error('Error reading bracket data:', error);
    return res.status(500).json({ error: 'Failed to read bracket data' });
  }
});

// Helper function to find a match by ID
const findMatchById = (bracketData, matchId) => {
  let matchRoundIndex = -1;
  let matchIndex = -1;

  bracketData.rounds.forEach((round, roundIndex) => {
    const foundMatchIndex = round.matches.findIndex(match => match.id === matchId);
    if (foundMatchIndex !== -1) {
      matchRoundIndex = roundIndex;
      matchIndex = foundMatchIndex;
    }
  });

  if (matchRoundIndex === -1 || matchIndex === -1) {
    return null;
  }

  return {
    match: bracketData.rounds[matchRoundIndex].matches[matchIndex],
    roundIndex: matchRoundIndex,
    matchIndex: matchIndex
  };
};

// Helper function to get the next match in the tournament
const getNextMatch = (bracketData, currentRoundIndex, currentMatchIndex) => {
  // If it's the final, there's no next match
  if (currentRoundIndex === bracketData.rounds.length - 1) {
    return null;
  }

  // Calculate the next match ID and position
  const nextRoundIndex = currentRoundIndex + 1;
  const nextMatchIndex = Math.floor(currentMatchIndex / 2);
  
  return {
    match: bracketData.rounds[nextRoundIndex].matches[nextMatchIndex],
    roundIndex: nextRoundIndex,
    matchIndex: nextMatchIndex,
    position: currentMatchIndex % 2 // 0 for top team, 1 for bottom team
  };
};

// POST /api/bracket/match/:id - Update a match score and propagate winner
app.post('/api/bracket/match/:id', (req, res) => {
  const matchId = parseInt(req.params.id);
  const { teams, winner, reset } = req.body;
  
  if (!matchId || (!teams && !reset) || (teams && winner === undefined && !reset)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const bracketData = JSON.parse(fs.readFileSync(bracketFilePath, 'utf8'));
    
    // Find the match
    const matchData = findMatchById(bracketData, matchId);
    if (!matchData) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const { match, roundIndex, matchIndex } = matchData;
    
    if (reset) {
      // Reset match scores and completion status
      match.teams.forEach(team => {
        team.score = 0;
      });
      match.winner = null;
      match.completed = false;
      
      // Reset subsequent matches if they contain this match's winner
      if (roundIndex < bracketData.rounds.length - 1) {
        const nextMatch = getNextMatch(bracketData, roundIndex, matchIndex);
        if (nextMatch && nextMatch.match.teams[nextMatch.position].name === match.teams[match.winner]?.name) {
          // Clear the team in the next match
          nextMatch.match.teams[nextMatch.position] = {
            name: null,
            score: 0,
            image: null
          };
          
          // Reset that match too if it's completed
          if (nextMatch.match.completed) {
            // Recursive reset of all subsequent matches
            const resetBody = { reset: true };
            const resetReq = { params: { id: nextMatch.match.id }, body: resetBody };
            const resetRes = { json: () => {}, status: () => ({ json: () => {} }) };
            app.routes.post.forEach(route => {
              if (route.path === '/api/bracket/match/:id') {
                route.callbacks[0](resetReq, resetRes);
              }
            });
          }
        }
      }
    } else {
      // Update the match
      match.teams = teams;
      match.winner = winner;
      match.completed = true;

      // Propagate the winner to the next match if not the final
      if (roundIndex < bracketData.rounds.length - 1) {
        const nextMatch = getNextMatch(bracketData, roundIndex, matchIndex);
        if (nextMatch) {
          const winningTeam = match.teams[winner];
          nextMatch.match.teams[nextMatch.position] = {
            name: winningTeam.name,
            score: 0,
            image: winningTeam.image
          };
        }
      }
    }

    // Save changes
    fs.writeFileSync(bracketFilePath, JSON.stringify(bracketData, null, 2));
    
    return res.json({ success: true, data: match });
  } catch (error) {
    console.error('Error updating match:', error);
    return res.status(500).json({ error: 'Failed to update bracket data' });
  }
});

// DELETE /api/bracket/match/:id - Reset a match score and propagate changes
app.delete('/api/bracket/match/:id', (req, res) => {
  const matchId = parseInt(req.params.id);
  
  if (!matchId) {
    return res.status(400).json({ error: 'Missing match ID' });
  }

  try {
    const bracketData = JSON.parse(fs.readFileSync(bracketFilePath, 'utf8'));
    
    // Find the match
    const matchData = findMatchById(bracketData, matchId);
    if (!matchData) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const { match, roundIndex, matchIndex } = matchData;
    
    // Reset match scores and completion status
    match.teams.forEach(team => {
      if (team.name) {
        team.score = 0;
      }
    });
    match.winner = null;
    match.completed = false;
    
    // Reset subsequent matches if they were affected
    if (roundIndex < bracketData.rounds.length - 1) {
      const nextMatch = getNextMatch(bracketData, roundIndex, matchIndex);
      if (nextMatch) {
        const nextTeam = nextMatch.match.teams[nextMatch.position];
        const teamNamesInCurrentMatch = match.teams.map(t => t.name);
        
        // If the team in next match came from this match, reset it
        if (nextTeam.name && teamNamesInCurrentMatch.includes(nextTeam.name)) {
          nextMatch.match.teams[nextMatch.position] = {
            name: null,
            score: 0,
            image: null
          };
          
          // If next match was completed, reset it too
          if (nextMatch.match.completed) {
            // Use delete endpoint recursively
            const deleteReq = { params: { id: nextMatch.match.id } };
            const deleteRes = { json: () => {}, status: () => ({ json: () => {} }) };
            app.routes.delete.forEach(route => {
              if (route.path === '/api/bracket/match/:id') {
                route.callbacks[0](deleteReq, deleteRes);
              }
            });
          }
        }
      }
    }

    // Save changes
    fs.writeFileSync(bracketFilePath, JSON.stringify(bracketData, null, 2));
    
    return res.json({ success: true, data: match });
  } catch (error) {
    console.error('Error resetting match:', error);
    return res.status(500).json({ error: 'Failed to reset match data' });
  }
});

// POST /api/bracket/participant - Update a participant name or image
app.post('/api/bracket/participant', (req, res) => {
  const { oldName, newName, image, removeImage } = req.body;
  
  if (!oldName || (!newName && image === undefined && removeImage === undefined)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const bracketData = JSON.parse(fs.readFileSync(bracketFilePath, 'utf8'));
    let updated = false;
    
    // Make sure we have a participants array
    if (!bracketData.participants) {
      bracketData.participants = [];
    }
    
    // Update participant in the participants list
    let participant = bracketData.participants.find(p => p.name === oldName);
    if (!participant) {
      // Add new participant if not found
      participant = { name: oldName, image: null };
      bracketData.participants.push(participant);
    }
    
    // Update participant data
    if (newName) participant.name = newName;
    if (image) participant.image = image;
    if (removeImage) participant.image = null;
    
    // Update participant across all matches
    bracketData.rounds.forEach(round => {
      round.matches.forEach(match => {
        match.teams.forEach(team => {
          if (team.name === oldName) {
            if (newName) team.name = newName;
            if (image) team.image = image;
            if (removeImage) team.image = null;
            updated = true;
          }
        });
      });
    });
    
    // Even if we didn't update matches, we've updated the participants list
    updated = true;
    
    // Save changes
    fs.writeFileSync(bracketFilePath, JSON.stringify(bracketData, null, 2));
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating participant:', error);
    return res.status(500).json({ error: 'Failed to update participant data' });
  }
});

// GET /api/bracket/current-match - Get the current (first incomplete) match
app.get('/api/bracket/current-match', (req, res) => {
  try {
    const bracketData = JSON.parse(fs.readFileSync(bracketFilePath, 'utf8'));
    
    // Find the first incomplete match
    let currentMatch = null;
    let currentRound = null;

    for (let i = 0; i < bracketData.rounds.length; i++) {
      const round = bracketData.rounds[i];
      const incompleteMatch = round.matches.find(match => 
        !match.completed && match.teams[0].name && match.teams[1].name
      );
      
      if (incompleteMatch) {
        currentMatch = incompleteMatch;
        currentRound = round.name;
        break;
      }
    }

    if (!currentMatch) {
      return res.status(404).json({ message: 'No current match found' });
    }

    return res.json({
      round: currentRound,
      match: currentMatch.id,
      teams: currentMatch.teams.map(team => team.name),
      score: currentMatch.teams.map(team => team.score),
      images: currentMatch.teams.map(team => team.image)
    });
  } catch (error) {
    console.error('Error fetching current match:', error);
    return res.status(500).json({ error: 'Failed to read bracket data' });
  }
});

// GET /api/bracket/final - Get the tournament winner
app.get('/api/bracket/final', (req, res) => {
  try {
    const bracketData = JSON.parse(fs.readFileSync(bracketFilePath, 'utf8'));
    
    const finalRound = bracketData.rounds[bracketData.rounds.length - 1];
    const finalMatch = finalRound.matches[0];

    if (!finalMatch.completed) {
      return res.status(404).json({ message: 'Tournament not completed yet' });
    }

    const winner = finalMatch.teams[finalMatch.winner];

    return res.json({
      winner: winner.name,
      score: [finalMatch.teams[0].score, finalMatch.teams[1].score],
      teams: finalMatch.teams.map(team => team.name),
      images: finalMatch.teams.map(team => team.image)
    });
  } catch (error) {
    console.error('Error fetching tournament winner:', error);
    return res.status(500).json({ error: 'Failed to read bracket data' });
  }
});

// GET /api/bracket/participants - Get all participants
app.get('/api/bracket/participants', (req, res) => {
  try {
    const bracketData = JSON.parse(fs.readFileSync(bracketFilePath, 'utf8'));
    
    // If we have a dedicated participants array, use that
    if (bracketData.participants && bracketData.participants.length > 0) {
      return res.json(bracketData.participants);
    }
    
    // Otherwise extract from matches
    const participants = new Map();
    
    bracketData.rounds.forEach(round => {
      round.matches.forEach(match => {
        match.teams.forEach(team => {
          if (team.name) {
            participants.set(team.name, {
              name: team.name,
              image: team.image || null
            });
          }
        });
      });
    });
    
    return res.json(Array.from(participants.values()));
  } catch (error) {
    console.error('Error fetching participants:', error);
    return res.status(500).json({ error: 'Failed to read bracket data' });
  }
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Support --port argument (node server.js --port 3500)
let PORT = 5000;
const argPort = process.argv.find((arg, i, arr) => arg === '--port' && arr[i+1]) ? parseInt(process.argv[process.argv.indexOf('--port')+1], 10) : null;
if (process.env.PORT) PORT = parseInt(process.env.PORT, 10);
if (argPort) PORT = argPort;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
