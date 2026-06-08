import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type CelebrationType =
  | 'xp'
  | 'achievement'
  | 'rank_up'
  | 'top_3'
  | 'number_1'
  | 'streak'
  | 'goal_achieved';

export interface CelebrationEvent {
  id: string;
  type: CelebrationType;
  message: string;
  subMessage?: string;
  xpAmount?: number;
  icon?: string;
  confetti?: boolean;
}

interface CelebrationContextType {
  queue: CelebrationEvent[];
  celebrate: (event: Omit<CelebrationEvent, 'id'>) => void;
  dismiss: () => void;
}

const CelebrationContext = createContext<CelebrationContextType>({
  queue: [],
  celebrate: () => {},
  dismiss: () => {},
});

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<CelebrationEvent[]>([]);
  const idCounter = useRef(0);

  const celebrate = useCallback((event: Omit<CelebrationEvent, 'id'>) => {
    const id = `celebration-${++idCounter.current}`;
    setQueue((prev) => [...prev, { ...event, id }]);
  }, []);

  const dismiss = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  return (
    <CelebrationContext.Provider value={{ queue, celebrate, dismiss }}>
      {children}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  return useContext(CelebrationContext);
}
