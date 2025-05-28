/**
 * Tournament Bracket Initialization Script
 * This script ensures the bracket data is properly set up with default values
 */

const fs = require('fs');
const path = require('path');

// Define data path
const dataPath = path.join(__dirname, 'data');
const bracketFilePath = path.join(dataPath, 'bracket.json');

// Default team names
const teamNames = [
  'Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta',
  'Team Epsilon', 'Team Zeta', 'Team Eta', 'Team Theta',
  'Team Iota', 'Team Kappa', 'Team Lambda', 'Team Mu',
  'Team Nu', 'Team Xi', 'Team Omicron', 'Team Pi'
];

// Vérification anti-duplication
const uniqueNames = new Set(teamNames);
if (uniqueNames.size !== teamNames.length) {
  throw new Error('Erreur: Des équipes sont dupliquées dans teamNames ! Veuillez corriger la liste.');
}

// Ensure data directory exists
if (!fs.existsSync(dataPath)) {
  console.log('Creating data directory...');
  fs.mkdirSync(dataPath);
}

// Check if we need to create or update the bracket file
let shouldCreateFile = !fs.existsSync(bracketFilePath);
let shouldUpdateFile = false;
let bracketData = null;

if (shouldCreateFile) {
  console.log('Bracket file does not exist. Creating new bracket data...');
  
  // Create initial bracket data with 16 participants
  bracketData = {
    rounds: [
      {
        name: "Huitièmes de finale",
        matches: Array.from({ length: 8 }, (_, i) => ({
          id: i + 1,
          teams: [
            { 
              name: teamNames[i * 2], 
              score: 0,
              image: null 
            },
            { 
              name: teamNames[i * 2 + 1], 
              score: 0,
              image: null 
            }
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
            { name: null, score: 0, image: null },
            { name: null, score: 0, image: null }
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
            { name: null, score: 0, image: null },
            { name: null, score: 0, image: null }
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
              { name: null, score: 0, image: null },
              { name: null, score: 0, image: null }
            ],
            winner: null,
            completed: false
          }
        ]
      }
    ],
    participants: teamNames.map(name => ({
      name,
      image: null
    }))
  };
} else {
  console.log('Bracket file exists. Checking for required updates...');
  
  try {
    bracketData = JSON.parse(fs.readFileSync(bracketFilePath, 'utf8'));
    
    // Check if participants array exists
    if (!bracketData.participants) {
      console.log('Adding participants array to existing data...');
      shouldUpdateFile = true;
      
      // Extract participants from matches
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
      
      bracketData.participants = Array.from(participants.values());
    }
    
    // Ensure all teams have image property
    bracketData.rounds.forEach(round => {
      round.matches.forEach(match => {
        match.teams.forEach(team => {
          if (team.name && team.image === undefined) {
            console.log(`Adding missing image property to team: ${team.name}`);
            team.image = null;
            shouldUpdateFile = true;
          }
        });
      });
    });
  } catch (error) {
    console.error('Error reading bracket file:', error);
    console.log('Creating new bracket file due to error...');
    shouldCreateFile = true;
  }
}

// Write the data to file if needed
if (shouldCreateFile || shouldUpdateFile) {
  try {
    fs.writeFileSync(bracketFilePath, JSON.stringify(bracketData, null, 2));
    console.log('Bracket data saved successfully.');
  } catch (error) {
    console.error('Error writing bracket file:', error);
    process.exit(1);
  }
} else {
  console.log('No updates needed for bracket data.');
}

console.log('Bracket initialization complete.');
