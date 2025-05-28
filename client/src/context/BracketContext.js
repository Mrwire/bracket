import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const BracketContext = createContext();

export const BracketProvider = ({ children }) => {
  const [bracketData, setBracketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Clean up socket connection on unmount
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  // Load initial bracket data
  useEffect(() => {
    const fetchBracketData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/bracket');
        setBracketData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching bracket data:', err);
        setError('Impossible de charger les données du tournoi');
      } finally {
        setLoading(false);
      }
    };

    fetchBracketData();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on('bracketUpdate', (data) => {
      setBracketData(data);
    });

    return () => {
      socket.off('bracketUpdate');
    };
  }, [socket]);

  // Update match scores and determine winner
  const updateMatch = useCallback(async (matchId, teams, winnerId) => {
    try {
      await axios.post(`/api/bracket/match/${matchId}`, {
        teams,
        winner: winnerId
      });
      return true;
    } catch (err) {
      console.error('Error updating match:', err);
      setError('Erreur lors de la mise à jour du match');
      return false;
    }
  }, []);

  // Get the current match in progress
  const getCurrentMatch = useCallback(async () => {
    try {
      const response = await axios.get('/api/bracket/current-match');
      return response.data;
    } catch (err) {
      console.error('Error fetching current match:', err);
      setError('Impossible de récupérer le match en cours');
      return null;
    }
  }, []);

  // Get the tournament winner if available
  const getTournamentWinner = useCallback(async () => {
    try {
      const response = await axios.get('/api/bracket/final');
      return response.data;
    } catch (err) {
      // 404 means tournament isn't complete yet, which is not an error
      if (err.response && err.response.status === 404) {
        return null;
      }
      console.error('Error fetching tournament winner:', err);
      setError('Impossible de récupérer le vainqueur du tournoi');
      return null;
    }
  }, []);

  return (
    <BracketContext.Provider
      value={{
        bracketData,
        loading,
        error,
        updateMatch,
        getCurrentMatch,
        getTournamentWinner
      }}
    >
      {children}
    </BracketContext.Provider>
  );
};

export default BracketContext;
