import React, { useEffect, useState } from 'react';
import Bracket from './components/Bracket';
import Header from './components/Header';
import { useBracket } from './hooks/useBracket';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const { loading, error } = useBracket();

  useEffect(() => {
    // Check for admin mode in URL params
    const params = new URLSearchParams(window.location.search);
    const adminParam = params.get('admin');
    setIsAdmin(adminParam === 'true');
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-bold text-primary">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-bold text-error">
          Erreur de chargement: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isAdmin={isAdmin} />
      <main className="container mx-auto px-4">
        <Bracket isAdmin={isAdmin} />
      </main>
    </div>
  );
}

export default App;
