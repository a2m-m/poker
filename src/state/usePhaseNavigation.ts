import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGameState } from './GameStateContext';
import { selectGamePhase } from './selectors';

const phaseToPath = {
  TABLE: '/table',
  SHOWDOWN: '/showdown',
  PAYOUT: '/payout',
} as const;

export const usePhaseNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameState } = useGameState();
  const currentPhase = selectGamePhase(gameState);

  useEffect(() => {
    if (!currentPhase) return;
    const managedPaths = new Set(['/table', '/showdown', '/payout']);

    if (!managedPaths.has(location.pathname)) return;

    const targetPath = phaseToPath[currentPhase];

    if (location.pathname === targetPath) return;

    navigate(targetPath, { replace: true });
  }, [currentPhase, location.pathname, navigate]);

  return currentPhase;
};
