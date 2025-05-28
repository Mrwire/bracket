import { useContext } from 'react';
import BracketContext from '../context/BracketContext';

export const useBracket = () => {
  const context = useContext(BracketContext);
  
  if (!context) {
    throw new Error('useBracket must be used within a BracketProvider');
  }
  
  return context;
};
