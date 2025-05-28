const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const bracketFilePath = path.join(__dirname, '../../data/bracket.json');

// Helper function to read bracket data
const readBracketData = () => {
  try {
    return JSON.parse(fs.readFileSync(bracketFilePath, 'utf8'));
  } catch (error) {
    console.error('Error reading bracket data:', error);
    return null;
  }
};

// Helper function to write bracket data
const writeBracketData = (data) => {
  try {
    fs.writeFileSync(bracketFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing bracket data:', error);
    return false;
  }
};

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

// GET /api/bracket - Get the entire bracket structure
router.get('/', (req, res) => {
  const bracketData = readBracketData();
  if (!bracketData) {
    return res.status(500).json({ error: 'Failed to read bracket data' });
  }
  return res.json(bracketData);
});

// POST /api/bracket/match/:id - Update a match score and propagate winner
router.post('/match/:id', (req, res) => {
  const matchId = parseInt(req.params.id);
  const { teams, winner } = req.body;
  
  if (!matchId || !teams || winner === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const bracketData = readBracketData();
  if (!bracketData) {
    return res.status(500).json({ error: 'Failed to read bracket data' });
  }

  // Find the match
  const matchData = findMatchById(bracketData, matchId);
  if (!matchData) {
    return res.status(404).json({ error: 'Match not found' });
  }

  // Update the match
  const { match, roundIndex, matchIndex } = matchData;
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
        score: 0
      };
    }
  }

  // Save changes
  if (!writeBracketData(bracketData)) {
    return res.status(500).json({ error: 'Failed to update bracket data' });
  }

  // Emit socket.io event for real-time updates if io is available
  if (req.io) {
    req.io.emit('bracketUpdate', bracketData);
  }

  return res.json({ success: true, data: match });
});

// GET /api/bracket/current-match - Get the current (first incomplete) match
router.get('/current-match', (req, res) => {
  const bracketData = readBracketData();
  if (!bracketData) {
    return res.status(500).json({ error: 'Failed to read bracket data' });
  }

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
    score: currentMatch.teams.map(team => team.score)
  });
});

// GET /api/bracket/final - Get the tournament winner
router.get('/final', (req, res) => {
  const bracketData = readBracketData();
  if (!bracketData) {
    return res.status(500).json({ error: 'Failed to read bracket data' });
  }

  const finalRound = bracketData.rounds[bracketData.rounds.length - 1];
  const finalMatch = finalRound.matches[0];

  if (!finalMatch.completed) {
    return res.status(404).json({ message: 'Tournament not completed yet' });
  }

  const winner = finalMatch.teams[finalMatch.winner];

  return res.json({
    winner: winner.name,
    score: [finalMatch.teams[0].score, finalMatch.teams[1].score],
    teams: finalMatch.teams.map(team => team.name)
  });
});

module.exports = router;
