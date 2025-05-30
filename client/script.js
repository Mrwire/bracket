/**
 * Tournament Bracket Manager
 * A futuristic single-page application for a single elimination tournament bracket with 16 participants
 */

// Global Variables
let bracketData = null;
let isAdmin = false;
let participantsData = [];
// Déterminer si nous sommes en production ou en développement local
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000/api' : 'http://141.94.208.84/api';
const PASSWORD = 'api123456'; // Password for accessing the application
const DEFAULT_PARTICIPANT_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmNjYwMCI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

// DOM Elements
const appElement = document.getElementById('app');
const loginScreen = document.getElementById('login-screen');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');
const bracketContainer = document.getElementById('bracket-container');
const tournamentInfo = document.getElementById('tournament-info');
const adminLink = document.getElementById('admin-link');
const editParticipantsBtn = document.getElementById('edit-participants-btn');
const tabs = document.querySelectorAll('.tab');
const bracketTab = document.getElementById('bracket-tab');
const participantsTab = document.getElementById('participants-tab');
const apiTab = document.getElementById('api-tab');
const participantsList = document.getElementById('participants-list');

// Initialize the application
// Debounce function to limit how often a function can be called
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  // --- Bracket UX: Scroll Buttons & Drag ---
  const bracketContainer = document.getElementById('bracket-container');
  const scrollLeftBtn = document.getElementById('scrollLeftBtn');
  const scrollRightBtn = document.getElementById('scrollRightBtn');
  const resetAllBtn = document.getElementById('reset-all-btn');
  if (bracketContainer && scrollLeftBtn && scrollRightBtn) {
    // Scroll buttons
    scrollLeftBtn.addEventListener('click', () => {
      bracketContainer.scrollBy({ left: -320, behavior: 'smooth' });
    });
    scrollRightBtn.addEventListener('click', () => {
      bracketContainer.scrollBy({ left: 320, behavior: 'smooth' });
    });
    // Hide buttons on mobile or if not scrollable
    function updateScrollButtons() {
      if (window.innerWidth < 700 || bracketContainer.scrollWidth <= bracketContainer.clientWidth + 10) {
        scrollLeftBtn.style.display = 'none';
        scrollRightBtn.style.display = 'none';
      } else {
        scrollLeftBtn.style.display = 'flex';
        scrollRightBtn.style.display = 'flex';
      }
    }
    bracketContainer.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);
    setTimeout(updateScrollButtons, 100);
    // Drag to scroll (desktop)
    let isDown = false, startX, scrollLeft;
    bracketContainer.addEventListener('mousedown', (e) => {
      isDown = true;
      bracketContainer.classList.add('dragging');
      startX = e.pageX - bracketContainer.offsetLeft;
      scrollLeft = bracketContainer.scrollLeft;
    });
    bracketContainer.addEventListener('mouseleave', () => {
      isDown = false;
      bracketContainer.classList.remove('dragging');
    });
    bracketContainer.addEventListener('mouseup', () => {
      isDown = false;
      bracketContainer.classList.remove('dragging');
    });
    bracketContainer.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - bracketContainer.offsetLeft;
      const walk = (x - startX) * 1.2;
      bracketContainer.scrollLeft = scrollLeft - walk;
    });
    // Touch/Swipe (mobile)
    let touchStartX = 0, touchScrollLeft = 0;
    bracketContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].pageX;
      touchScrollLeft = bracketContainer.scrollLeft;
    });
    bracketContainer.addEventListener('touchmove', (e) => {
      const x = e.touches[0].pageX;
      const walk = (x - touchStartX) * 1.1;
      bracketContainer.scrollLeft = touchScrollLeft - walk;
    });
  }
  // --- Fin Bracket UX ---

  // Handle password login
  loginForm.addEventListener('submit', handleLogin);
  
  // Check for admin mode in URL params
  const urlParams = new URLSearchParams(window.location.search);
  isAdmin = urlParams.get('admin') === 'true';
  
  // Event listener for admin toggle
  adminLink.addEventListener('click', (e) => {
    e.preventDefault();
    isAdmin = !isAdmin;
    // Update URL without refreshing the page
    const url = new URL(window.location);
    if (isAdmin) {
      url.searchParams.set('admin', 'true');
    } else {
      url.searchParams.delete('admin');
    }
    window.history.pushState({}, '', url);
    toggleAdminUI(isAdmin);
  });

  // Setup tab navigation
  setupTabs();
  
  // Edit participants button
  editParticipantsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    activateTab('participants');
  });
  
  // Reset all scores button (only visible in admin mode)
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      if (confirm('Êtes-vous sûr de vouloir réinitialiser TOUS les scores et tous les matchs? Cette action ne peut pas être annulée.')) {
        resetAllBtn.disabled = true;
        resetAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Réinitialisation...';
        
        fetch(`${API_URL}/bracket/reset-all`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => {
          if (response.ok) {
            showSuccess('Tous les scores ont été réinitialisés');
            setTimeout(fetchBracketData, 500); // Rafraîchir le bracket après un délai
          } else {
            throw new Error('Failed to reset all scores');
          }
        })
        .catch(err => {
          console.error('Error resetting all scores:', err);
          showError('Erreur lors de la réinitialisation des scores');
        })
        .finally(() => {
          resetAllBtn.disabled = false;
          resetAllBtn.innerHTML = '<i class="fas fa-undo"></i> Réinitialiser tous les scores';
        });
      }
    });
  }
  
  // Check if user has a valid session
  const hasSession = localStorage.getItem('tournament_session');
  if (hasSession) {
    hideLoginScreen();
    initializeApp();
    
    // Update connectors on window resize with debounce
    window.addEventListener('resize', debounce(updateAllConnectors, 100));
    
    // Initial update with a small delay to ensure DOM is fully rendered
    setTimeout(updateAllConnectors, 100);
  }
});

/**
 * Handle login form submission
 * @param {Event} e - Form submission event
 */
function handleLogin(e) {
  e.preventDefault();
  const password = passwordInput.value.trim();
  
  if (password === PASSWORD) {
    // Save session to localStorage
    localStorage.setItem('tournament_session', 'true');
    // Activer automatiquement le mode admin après une connexion réussie
    isAdmin = true;
    
    // Update URL without refreshing the page
    const url = new URL(window.location);
    url.searchParams.set('admin', 'true');
    window.history.pushState({}, '', url);
    
    hideLoginScreen();
    initializeApp();
  } else {
    loginError.textContent = 'Incorrect password. Please try again.';
    passwordInput.value = '';
    passwordInput.focus();
    
    // Shake animation effect
    loginForm.classList.add('shake');
    setTimeout(() => {
      loginForm.classList.remove('shake');
    }, 500);
  }
}

/**
 * Hide login screen and show main app
 */
function hideLoginScreen() {
  loginScreen.style.display = 'none';
  appElement.style.display = 'block';
}

/**
 * Initialize the application after login
 */
function initializeApp() {
  toggleAdminUI(isAdmin);
  // Load the bracket data
  fetchBracketData();
}

/**
 * Setup tab navigation
 */
function setupTabs() {
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      activateTab(tabName);
    });
  });
}

/**
 * Activate a specific tab
 * @param {string} tabName - Name of the tab to activate
 */
function activateTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(content => {
    content.style.display = 'none';
  });
  
  // Remove active class from all tabs
  tabs.forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab content
  document.getElementById(`${tabName}-tab`).style.display = 'block';
  
  // Add active class to selected tab
  document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
}

/**
 * Toggle admin UI elements
 * @param {boolean} isAdmin - Whether admin mode is active
 */
function toggleAdminUI(isAdmin) {
  if (isAdmin) {
    document.body.classList.add('admin-mode');
    adminLink.textContent = 'Mode Admin (Actif)';
    adminLink.classList.add('active');
    editParticipantsBtn.style.display = 'block';
  } else {
    document.body.classList.remove('admin-mode');
    adminLink.textContent = 'Passer en mode admin';
    adminLink.classList.remove('active');
    editParticipantsBtn.style.display = 'none';
  }
  
  // If we already have bracket data, re-render to show/hide admin controls
  if (bracketData) {
    renderBracket(bracketData);
  }
}

/**
 * Fetch tournament bracket data from API
 */
async function fetchBracketData() {
  try {
    const response = await fetch(`${API_URL}/bracket`);
    if (!response.ok) {
      throw new Error('Failed to fetch bracket data');
    }
    
    bracketData = await response.json();
    
    // Extract participants for editing
    extractParticipants(bracketData);
    
    // Render the bracket
    renderBracket(bracketData);
    
    // Check if there's a winner
    checkForWinner();
    
    // Initialize participants editor
    renderParticipantsEditor();
  } catch (error) {
    console.error('Error fetching bracket data:', error);
    showError('Impossible de charger les données du tournoi');
  }
}

/**
 * Extract all participants from bracket data
 * @param {Object} data - The bracket data
 */
function extractParticipants(data) {
  participantsData = [];
  
  // If server provides a dedicated participants array, use it
  if (data.participants && data.participants.length > 0) {
    participantsData = [...data.participants];
    return;
  }
  
  // Otherwise extract from matches
  const seen = new Set();
  
  data.rounds.forEach(round => {
    round.matches.forEach(match => {
      match.teams.forEach(team => {
        if (team.name && !seen.has(team.name)) {
          seen.add(team.name);
          participantsData.push({
            name: team.name,
            image: team.image || DEFAULT_PARTICIPANT_IMAGE
          });
        }
      });
    });
  });
}

/**
 * Render the tournament bracket
 * @param {Object} data - The bracket data
 */
function renderBracket(data) {
  bracketContainer.innerHTML = '';
  
  data.rounds.forEach((round, roundIndex) => {
    const roundEl = document.createElement('div');
    roundEl.className = `round round-${roundIndex + 1}`;
    
    const roundTitle = document.createElement('div');
    roundTitle.className = 'round-title';
    roundTitle.textContent = round.name;
    roundEl.appendChild(roundTitle);
    
    const matchesContainer = document.createElement('div');
    matchesContainer.className = 'matches-container';
    
    round.matches.forEach((match, matchIndex) => {
      const matchEl = renderMatch(match, roundIndex, matchIndex);
      matchesContainer.appendChild(matchEl);
    });
    
    roundEl.appendChild(matchesContainer);
    bracketContainer.appendChild(roundEl);
    
    // Add connector elements after the round is rendered
    if (roundIndex < data.rounds.length - 1) {
      addConnectors(roundEl, roundIndex, round.matches.length);
    }
  });
}

/**
 * Render a single match
 * @param {Object} match - The match data
 * @param {number} roundIndex - The round index
 * @param {number} matchIndex - The match index
 * @returns {HTMLElement} - The match element
 */
function renderMatch(match, roundIndex, matchIndex) {
const matchEl = document.createElement('div');
matchEl.className = 'match';
matchEl.dataset.id = match.id;
matchEl.dataset.round = roundIndex;
matchEl.dataset.matchIndex = matchIndex;

// Render each team in the match
match.teams.forEach((team, index) => {
const teamEl = document.createElement('div');
teamEl.className = `team ${team.name ? '' : 'empty'}`;

// Add 'winner' or 'loser' class if match is completed
if (match.completed && team.name) {
if (match.winner === index) {
teamEl.classList.add('winner');
} else {
teamEl.classList.add('loser');
}
}

// Add team image if available
if (team.image) {
const imageEl = document.createElement('div');
imageEl.className = 'team-image';
imageEl.style.backgroundImage = `url(${team.image})`;
teamEl.appendChild(imageEl);
} else if (team.name) {
// Default avatar for participants without image
const imageEl = document.createElement('div');
imageEl.className = 'team-image default-avatar';
imageEl.style.backgroundImage = `url(${DEFAULT_PARTICIPANT_IMAGE})`;
teamEl.appendChild(imageEl);
}

// Add team name and score
const nameEl = document.createElement('span');
nameEl.className = 'team-name';
nameEl.textContent = team.name || 'TBD';
teamEl.appendChild(nameEl);

if (match.completed && team.name) {
const scoreEl = document.createElement('span');
scoreEl.className = 'team-score';
scoreEl.textContent = team.score;
teamEl.appendChild(scoreEl);
}

matchEl.appendChild(teamEl);
});

// Add admin controls for matches
if (isAdmin && match.teams[0].name && match.teams[1].name) {
const adminControls = document.createElement('div');
adminControls.className = 'admin-controls';

if (match.completed) {
// Créer un bouton "Modifier" pour les matchs complétés
const editButton = document.createElement('button');
editButton.className = 'btn btn-primary';
editButton.textContent = 'Modifier';
editButton.style.marginRight = '5px';

editButton.onclick = function() {
const matchForm = createMatchForm(match);
matchEl.innerHTML = '';
matchEl.appendChild(matchForm);
};
adminControls.appendChild(editButton);

      // Créer un bouton "Reset" simple
      const resetButton = document.createElement('button');
      resetButton.className = 'btn btn-danger';
      resetButton.textContent = 'Reset';
      
      resetButton.onclick = function() {
        if (confirm('Réinitialiser ce match? Cela affectera aussi les matchs suivants.')) {
          resetButton.disabled = true;
          resetButton.textContent = 'Réinitialisation...';
          
          // Méthode 1: Utiliser DELETE (ancienne approche qui fonctionne peut-être mieux)
          fetch(`${API_URL}/bracket/match/${match.id}`, {
            method: 'DELETE'
          })
          .then(response => {
            if (response.ok) {
              showSuccess('Match réinitialisé');
              setTimeout(fetchBracketData, 500); // Rafraîchir tout le bracket avec un délai
            } else {
              throw new Error('Failed to reset match');
            }
          })
          .catch(err => {
            console.error('Error resetting match (DELETE):', err);
            // Fallback: Essayer avec la méthode POST + reset:true
            fetch(`${API_URL}/bracket/match/${match.id}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                reset: true
              })
            })
            .then(response => {
              if (response.ok) {
                showSuccess('Match réinitialisé');
                setTimeout(fetchBracketData, 500);
              } else {
                showError('Erreur lors de la réinitialisation');
                resetButton.disabled = false;
                resetButton.textContent = 'Reset';
              }
            })
            .catch(err => {
              console.error('Reset error (POST):', err);
              showError('Erreur serveur');
              resetButton.disabled = false;
              resetButton.textContent = 'Reset';
            });
          });
        }
      };
adminControls.appendChild(resetButton);
} else {
// Add edit button for incomplete matches
const editBtn = document.createElement('button');
editBtn.className = 'btn btn-primary';
editBtn.title = 'Éditer ce match';
editBtn.textContent = 'Éditer';

editBtn.onclick = function() {
const matchForm = createMatchForm(match);
matchEl.innerHTML = '';
matchEl.appendChild(matchForm);
};

      adminControls.appendChild(editBtn);
    }

    matchEl.appendChild(adminControls);
  }

  return matchEl;
}

/**
 * Add connector lines between matches
 * @param {HTMLElement} roundEl - The round element
 * @param {number} roundIndex - The round index
 * @param {number} matchCount - Number of matches in the round
 */
// Store references to all connector containers
const connectorContainers = [];

function updateAllConnectors() {
  connectorContainers.forEach(container => {
    if (!container.parentElement) {
      // Remove references to containers that no longer exist in the DOM
      const index = connectorContainers.indexOf(container);
      if (index > -1) {
        connectorContainers.splice(index, 1);
      }
      return;
    }
    
    const roundEl = container.parentElement;
    const roundMatch = roundEl.className.match(/round-(\d+)/);
    if (!roundMatch) return;
    
    const roundIndex = parseInt(roundMatch[1]) - 1;
    const matches = roundEl.querySelectorAll('.match');
    
    // Remove existing connectors
    const existingConnectors = container.querySelectorAll('.connector-horizontal, .connector-vertical');
    existingConnectors.forEach(el => el.remove());
    
    // Add new connectors
    addConnectors(roundEl, roundIndex, matches.length);
  });
}

function addConnectors(roundEl, roundIndex, matchCount) {
  const nextRound = roundEl.nextElementSibling;
  if (!nextRound || !nextRound.querySelector) return;
  
  // Create or get connectors container
  let container = roundEl.querySelector('.connectors');
  if (!container) {
    container = document.createElement('div');
    container.className = 'connectors';
    roundEl.appendChild(container);
    
    // Store reference for updates if not already stored
    if (!connectorContainers.includes(container)) {
      connectorContainers.push(container);
    }
  } else {
    // Clear existing connectors
    container.innerHTML = '';
  }
  
  const currentMatches = roundEl.querySelectorAll('.match');
  const nextMatches = nextRound.querySelectorAll('.match');
  
  // Only proceed if we have matches in both rounds
  if (currentMatches.length === 0 || nextMatches.length === 0) return;
  
  // Calculate the number of matches to connect (should be half in a proper bracket)
  const connections = Math.min(currentMatches.length, nextMatches.length * 2);
  
  for (let i = 0; i < currentMatches.length; i++) {
    const matchIndex = Math.floor(i / 2);
    const nextMatch = nextMatches[matchIndex];
    const currentMatch = currentMatches[i];
    
    if (!nextMatch || !currentMatch) continue;
    
    // Create horizontal connector (from match to right)
    const horizontalConnector = document.createElement('div');
    horizontalConnector.className = 'connector-horizontal';
    
    // Create vertical connector (connects pairs of matches to next round)
    const verticalConnector = document.createElement('div');
    verticalConnector.className = 'connector-vertical';
    
    // Position the connectors
    const currentRect = currentMatch.getBoundingClientRect();
    const nextRect = nextMatch.getBoundingClientRect();
    const containerRect = roundEl.getBoundingClientRect();
    
    // Calculate positions relative to the container
    const currentY = currentRect.top + (currentRect.height / 2) - containerRect.top;
    const nextY = nextRect.top + (nextRect.height / 2) - containerRect.top;
    
    // Position horizontal connector (from match to right)
    horizontalConnector.style.position = 'absolute';
    horizontalConnector.style.top = `${currentY}px`;
    horizontalConnector.style.left = '100%';
    horizontalConnector.style.width = '30px';
    horizontalConnector.style.height = '2px';
    horizontalConnector.style.backgroundColor = 'var(--bracket-line)';
    horizontalConnector.style.boxShadow = '0 0 5px var(--primary-glow)';
    horizontalConnector.style.zIndex = '1';
    
    // Only add vertical connector for the first of each pair
    if (i % 2 === 0) {
      const nextMatch2 = currentMatches[i + 1];
      if (nextMatch2) {
        const nextRect2 = nextMatch2.getBoundingClientRect();
        const nextY2 = nextRect2.top + (nextRect2.height / 2) - containerRect.top;
        
        // Position vertical connector between pairs
        verticalConnector.style.position = 'absolute';
        verticalConnector.style.top = `${currentY}px`;
        verticalConnector.style.left = 'calc(100% + 30px)';
        verticalConnector.style.width = '2px';
        verticalConnector.style.height = `${nextY2 - currentY}px`;
        verticalConnector.style.backgroundColor = 'var(--bracket-line)';
        verticalConnector.style.boxShadow = '0 0 5px var(--primary-glow)';
        verticalConnector.style.zIndex = '1';
        
        // Add a small horizontal connector to the right of the vertical line
        const horizontalEnd = document.createElement('div');
        horizontalEnd.className = 'connector-horizontal-end';
        horizontalEnd.style.position = 'absolute';
        horizontalEnd.style.top = `${nextY2 - currentY}px`;
        horizontalEnd.style.left = '0';
        horizontalEnd.style.width = '30px';
        horizontalEnd.style.height = '2px';
        horizontalEnd.style.backgroundColor = 'var(--bracket-line)';
        horizontalEnd.style.boxShadow = '0 0 5px var(--primary-glow)';
        
        verticalConnector.appendChild(horizontalEnd);
      }
    }
    
    container.appendChild(horizontalConnector);
    if (i % 2 === 0) {
      container.appendChild(verticalConnector);
    }
  }
}

/**
 * Create admin controls for a match
 * @param {Object} match - The match data
 * @returns {HTMLElement} - The admin controls element
 */
function createAdminControls(match) {
  const adminControls = document.createElement('div');
  adminControls.className = 'admin-controls';
  
  const editButton = document.createElement('button');
  editButton.className = 'btn btn-primary';
  editButton.textContent = 'Modifier le score';
  
  editButton.addEventListener('click', () => {
    // Replace the button with a form
    const form = createMatchForm(match);
    adminControls.innerHTML = '';
    adminControls.appendChild(form);
  });
  
  adminControls.appendChild(editButton);
  return adminControls;
}

/**
 * Create a form for editing match scores
 * @param {Object} match - The match data
 * @returns {HTMLElement} - The form element
 */
function createMatchForm(match) {
  const form = document.createElement('form');
  form.className = 'match-form';
  form.dataset.matchId = match.id;
  
  // Créer un conteneur pour les inputs de score
  const inputsContainer = document.createElement('div');
  inputsContainer.className = 'inputs-container';
  
  // Create score inputs for both teams
  match.teams.forEach((team, index) => {
    // Ajouter le nom de l'équipe comme label
    const teamLabel = document.createElement('span');
    teamLabel.textContent = team.name || 'TBD';
    teamLabel.className = 'team-label';
    inputsContainer.appendChild(teamLabel);
    
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'input-score';
    input.min = 0;
    input.value = team.score;
    input.dataset.index = index;
    inputsContainer.appendChild(input);
    
    // Add a label if more than one input
    if (index < match.teams.length - 1) {
      const separator = document.createElement('span');
      separator.textContent = ' - ';
      inputsContainer.appendChild(separator);
    }
  });
  
  form.appendChild(inputsContainer);
  
  // Create button container
  const btnContainer = document.createElement('div');
  btnContainer.className = 'btn-container';
  
  // Create submit button
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn btn-primary';
  submitBtn.title = 'Valider';
  submitBtn.textContent = 'Valider';
  btnContainer.appendChild(submitBtn);
  
  // Create cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.title = 'Annuler';
  cancelBtn.textContent = 'Annuler';
  btnContainer.appendChild(cancelBtn);
  
  // Fonction pour fermer le formulaire et restaurer l'UI originale
  function closeForm() {
    // Re-render the match to reset UI
    const matchEl = document.querySelector(`.match[data-id="${match.id}"]`);
    const roundIndex = parseInt(matchEl.dataset.round);
    const matchIndex = parseInt(matchEl.dataset.matchIndex);
    
    const newMatchEl = renderMatch(match, roundIndex, matchIndex);
    matchEl.parentNode.replaceChild(newMatchEl, matchEl);
  }
  
  // Utiliser closeForm pour le bouton d'annulation
  cancelBtn.onclick = closeForm;
  
  // Create reset button (only if both teams have scores)
  const hasScores = match.teams.some(team => team.score > 0);
  if (hasScores) {
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn btn-danger';
    resetBtn.title = 'Réinitialiser les scores';
    resetBtn.textContent = 'Réinitialiser';
    btnContainer.appendChild(resetBtn);
    
    resetBtn.onclick = function() {
      if (confirm('Réinitialiser ce match? Cela affectera aussi les matchs suivants.')) {
        resetBtn.disabled = true;
        resetBtn.textContent = 'Réinitialisation...';
        
        // Méthode 1: Utiliser DELETE (ancienne approche qui fonctionne peut-être mieux)
        fetch(`${API_URL}/bracket/match/${match.id}`, {
          method: 'DELETE'
        })
        .then(response => {
          if (response.ok) {
            showSuccess('Match réinitialisé');
            setTimeout(fetchBracketData, 500); // Rafraîchir tout le bracket avec un délai
          } else {
            throw new Error('Failed to reset match');
          }
        })
        .catch(err => {
          console.error('Error resetting match (DELETE):', err);
          // Fallback: Essayer avec la méthode POST + reset:true
          fetch(`${API_URL}/bracket/match/${match.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              reset: true
            })
          })
          .then(response => {
            if (response.ok) {
              showSuccess('Match réinitialisé');
              setTimeout(fetchBracketData, 500);
            } else {
              showError('Erreur lors de la réinitialisation');
              resetBtn.disabled = false;
              resetBtn.textContent = 'Reset';
            }
          })
          .catch(err => {
            console.error('Reset error (POST):', err);
            showError('Erreur serveur');
            resetBtn.disabled = false;
            resetBtn.textContent = 'Reset';
          });
        });
      }
    };
  }
  
  // Handle form submission
  form.onsubmit = function(e) {
    e.preventDefault();
    
    // Get scores from inputs
    const inputs = form.querySelectorAll('.input-score');
    const scores = Array.from(inputs).map(input => parseInt(input.value, 10) || 0);
    
    // Determine winner (higher score)
    const winnerIndex = scores[0] > scores[1] ? 0 : scores[0] < scores[1] ? 1 : null;
    
    // Don't allow ties
    if (winnerIndex === null) {
      alert('Les scores ne peuvent pas être égaux. Un gagnant doit être déterminé.');
      return;
    }
    
    // Update match data
    const updatedTeams = match.teams.map((team, index) => ({
      ...team,
      score: scores[index]
    }));
    
    submitBtn.textContent = 'Mise à jour...';
    submitBtn.disabled = true;
    
    // Call API to update match
    fetch(`${API_URL}/bracket/match/${match.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        teams: updatedTeams,
        winner: winnerIndex
      })
    }).then(response => {
      if (response.ok) {
        showSuccess('Match mis à jour avec succès');
        fetchBracketData(); // Rafraîchir tout le bracket
      } else {
        throw new Error('Failed to update match');
      }
    }).catch(error => {
      console.error('Error updating match:', error);
      showError('Erreur lors de la mise à jour du match');
      submitBtn.textContent = 'Valider';
      submitBtn.disabled = false;
    });
  };
  
  form.appendChild(btnContainer);
  return form;
}

/**
 * Render participants editor
 */
function renderParticipantsEditor() {
  participantsList.innerHTML = '';
  
  participantsData.forEach((participant, index) => {
    const participantItem = document.createElement('div');
    participantItem.className = 'participant-item';
    participantItem.innerHTML = `
      <div class="participant-header">
        <div class="participant-image-container">
          <img class="participant-image" src="${participant.image || DEFAULT_PARTICIPANT_IMAGE}" alt="${participant.name}">
        </div>
        <h3>${participant.name}</h3>
      </div>
      <form class="participant-form" data-index="${index}">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input type="text" class="form-input participant-name-input" value="${participant.name}" required>
        </div>
        <div class="form-group">
          <label class="file-input-label">
            Upload Image
            <input type="file" class="file-input participant-image-input" accept="image/*">
          </label>
        </div>
        <div class="form-group buttons-container">
          <button type="submit" class="btn btn-primary">Update</button>
          ${participant.image && participant.image !== DEFAULT_PARTICIPANT_IMAGE ? 
            `<button type="button" class="btn btn-danger remove-image-btn">Remove Image</button>` : ''}
        </div>
      </form>
    `;
    
    // Handle participant form submission
    const form = participantItem.querySelector('.participant-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = form.querySelector('.participant-name-input');
      const newName = nameInput.value.trim();
      
      if (newName && newName !== participant.name) {
        await updateParticipantName(participant.name, newName);
      }
    });
    
    // Handle image upload
    const imageInput = participantItem.querySelector('.participant-image-input');
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const imageDataUrl = event.target.result;
          
          // Update in participants data
          participantsData[index].image = imageDataUrl;
          
          // Update image on the server
          await updateParticipantImage(participant.name, imageDataUrl);
          
          // Update the preview
          const previewImg = participantItem.querySelector('.participant-image');
          previewImg.src = imageDataUrl;
          
          // Refresh the UI to show the remove button
          renderParticipantsEditor();
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Handle image removal
    const removeImageBtn = participantItem.querySelector('.remove-image-btn');
    if (removeImageBtn) {
      removeImageBtn.addEventListener('click', async () => {
        // Remove image from participant
        await removeParticipantImage(participant.name);
        
        // Update in participants data
        participantsData[index].image = DEFAULT_PARTICIPANT_IMAGE;
        
        // Update the preview
        const previewImg = participantItem.querySelector('.participant-image');
        previewImg.src = DEFAULT_PARTICIPANT_IMAGE;
        
        // Hide the remove button
        removeImageBtn.style.display = 'none';
      });
    }
    
    participantsList.appendChild(participantItem);
  });
}

/**
 * Update participant name in the bracket
 * @param {string} oldName - Current name
 * @param {string} newName - New name
 */
async function updateParticipantName(oldName, newName) {
  try {
    // Call the API to update the participant
    const response = await fetch(`${API_URL}/bracket/participant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        oldName,
        newName
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update participant name');
    }
    
    // Show success message
    showSuccess(`Participant renamed from "${oldName}" to "${newName}"`);
    
    // Refresh the bracket data
    fetchBracketData();
  } catch (error) {
    console.error('Error updating participant:', error);
    showError('Erreur lors de la mise à jour du participant');
  }
}

/**
 * Update participant image in the bracket
 * @param {string} name - Participant name
 * @param {string} imageUrl - New image URL
 */
async function updateParticipantImage(name, imageUrl) {
  try {
    // Call the API to update the participant
    const response = await fetch(`${API_URL}/bracket/participant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        oldName: name,
        image: imageUrl
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update participant image');
    }
    
    // Show success message
    showSuccess(`Image updated for "${name}"`);
    
    // Refresh the bracket data
    fetchBracketData();
  } catch (error) {
    console.error('Error updating participant image:', error);
    showError('Erreur lors de la mise à jour de l\'image');
  }
}

/**
 * Remove participant image from the bracket
 * @param {string} name - Participant name
 */
async function removeParticipantImage(name) {
  try {
    // Call the API to remove the participant image
    const response = await fetch(`${API_URL}/bracket/participant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        oldName: name,
        removeImage: true
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove participant image');
    }
    
    // Show success message
    showSuccess(`Image removed for "${name}"`);
    
    // Refresh the bracket data
    fetchBracketData();
  } catch (error) {
    console.error('Error removing participant image:', error);
    showError('Erreur lors de la suppression de l\'image');
  }
}

/**
 * Check if the tournament has a winner
 */
async function checkForWinner() {
  try {
    const response = await fetch(`${API_URL}/bracket/final`);
    
    // If the tournament is not complete, the API will return 404
    if (response.status === 404) {
      tournamentInfo.innerHTML = '';
      return;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch winner data');
    }
    
    const winnerData = await response.json();
    
    // Find winner image if available
    const winnerParticipant = participantsData.find(p => p.name === winnerData.winner);
    const winnerImage = winnerParticipant ? winnerParticipant.image : (winnerData.images && winnerData.images[0]) || null;
    
    // Display the winner
    tournamentInfo.innerHTML = `
      <h2>Vainqueur du tournoi</h2>
      ${winnerImage ? `<img src="${winnerImage}" alt="${winnerData.winner}" style="width: 80px; height: 80px; border-radius: 50%; margin: 1rem auto; display: block; border: 2px solid var(--primary-color); box-shadow: 0 0 15px var(--primary-glow);">` : ''}
      <div class="winner">${winnerData.winner}</div>
      <div class="score">Score final: ${winnerData.score[0]} - ${winnerData.score[1]}</div>
    `;
  } catch (error) {
    if (error.message !== 'Failed to fetch winner data') {
      console.error('Error checking for winner:', error);
    }
  }
}

/**
 * Show a success message
 * @param {string} message - The success message
 */
function showSuccess(message) {
  const successEl = document.createElement('div');
  successEl.className = 'success-message';
  successEl.textContent = message;
  
  document.body.appendChild(successEl);
  
  // Remove after 3 seconds
  setTimeout(() => {
    successEl.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(successEl);
    }, 300);
  }, 3000);
}

/**
 * Show an error message
 * @param {string} message - The error message
 */
function showError(message) {
  tournamentInfo.innerHTML = `
    <div class="error-message">${message}</div>
  `;
}
