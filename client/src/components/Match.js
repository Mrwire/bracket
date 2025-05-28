import React, { useState } from 'react';
import { useBracket } from '../hooks/useBracket';

const Match = ({ match, isAdmin }) => {
  const [scores, setScores] = useState(match.teams.map(team => team.score));
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateMatch } = useBracket();
  
  // Check if match has both teams assigned
  const isMatchReady = match.teams[0].name && match.teams[1].name;
  
  // Handle score change from input
  const handleScoreChange = (index, value) => {
    const newValue = parseInt(value) || 0;
    const newScores = [...scores];
    newScores[index] = newValue;
    setScores(newScores);
  };
  
  // Determine winner based on scores
  const determineWinner = () => {
    if (scores[0] > scores[1]) return 0;
    if (scores[1] > scores[0]) return 1;
    return null; // Tie, shouldn't be allowed in a tournament
  };
  
  // Submit score update
  const handleSubmit = async () => {
    if (!isMatchReady) return;
    
    const winner = determineWinner();
    if (winner === null) {
      alert('Les scores doivent désigner un gagnant');
      return;
    }
    
    setIsSubmitting(true);
    
    // Update teams with new scores
    const updatedTeams = match.teams.map((team, index) => ({
      ...team,
      score: scores[index]
    }));
    
    const success = await updateMatch(match.id, updatedTeams, winner);
    
    if (success) {
      setIsEditing(false);
    }
    
    setIsSubmitting(false);
  };
  
  // Determine CSS classes for teams
  const getTeamClasses = (index) => {
    let classes = 'team';
    
    if (match.completed && match.winner === index) {
      classes += ' winner';
    } else if (match.completed && match.winner !== index) {
      classes += ' loser';
    }
    
    return classes;
  };
  
  return (
    <div className={`match ${match.completed ? 'completed' : ''}`}>
      {/* Team 1 */}
      <div className={getTeamClasses(0)}>
        <div className="team-name">{match.teams[0].name || 'TBD'}</div>
        <div className="team-score">
          {isEditing && isAdmin ? (
            <input
              type="number"
              min="0"
              value={scores[0]}
              onChange={(e) => handleScoreChange(0, e.target.value)}
              className="input-score"
            />
          ) : (
            match.teams[0].score
          )}
        </div>
      </div>
      
      {/* Team 2 */}
      <div className={getTeamClasses(1)}>
        <div className="team-name">{match.teams[1].name || 'TBD'}</div>
        <div className="team-score">
          {isEditing && isAdmin ? (
            <input
              type="number"
              min="0"
              value={scores[1]}
              onChange={(e) => handleScoreChange(1, e.target.value)}
              className="input-score"
            />
          ) : (
            match.teams[1].score
          )}
        </div>
      </div>
      
      {/* Admin controls */}
      {isAdmin && isMatchReady && (
        <div className="admin-controls">
          {isEditing ? (
            <>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !isMatchReady}
                className={`btn ${isSubmitting || !isMatchReady ? 'btn-disabled' : 'btn-primary'} mr-2`}
              >
                {isSubmitting ? 'Enregistrement...' : 'Valider'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
                className="btn btn-secondary"
              >
                Annuler
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              disabled={match.completed}
              className={`btn ${match.completed ? 'btn-disabled' : 'btn-primary'}`}
            >
              {match.completed ? 'Match terminé' : 'Modifier le score'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Match;
