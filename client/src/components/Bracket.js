import React, { useState, useEffect } from 'react';
import Match from './Match';
import { useBracket } from '../hooks/useBracket';

const Bracket = ({ isAdmin }) => {
  const { bracketData, getTournamentWinner } = useBracket();
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    // Check if tournament is complete and get winner
    const checkWinner = async () => {
      const winnerData = await getTournamentWinner();
      setWinner(winnerData);
    };
    
    checkWinner();
  }, [bracketData, getTournamentWinner]);

  if (!bracketData || !bracketData.rounds) {
    return <div>Aucune donnée de tournoi disponible</div>;
  }

  return (
    <div className="mt-6">
      {/* Winner banner, if tournament is complete */}
      {winner && (
        <div className="bg-secondary text-white p-4 rounded-lg mb-6 text-center">
          <h2 className="text-2xl font-bold">Vainqueur du tournoi</h2>
          <div className="text-3xl mt-2">{winner.winner}</div>
          <div className="text-lg mt-1">
            Score final: {winner.score[0]} - {winner.score[1]}
          </div>
        </div>
      )}

      {/* Tournament bracket */}
      <div className="bracket-container">
        {bracketData.rounds.map((round, roundIndex) => (
          <div key={roundIndex} className="round">
            <div className="text-center font-bold mb-4 text-primary">
              {round.name}
            </div>
            
            <div className="flex flex-col justify-around h-full">
              {round.matches.map((match) => (
                <Match 
                  key={match.id} 
                  match={match} 
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Bracket;
