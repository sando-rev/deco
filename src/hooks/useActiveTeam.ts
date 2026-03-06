import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCoachTeams } from './useTeam';
import { Team } from '../types/database';

const ACTIVE_TEAM_KEY = 'deco_active_team_id';

export function useActiveTeam() {
  const { data: teams = [], isLoading: teamsLoading } = useCoachTeams();
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load stored team ID on mount
  useEffect(() => {
    AsyncStorage.getItem(ACTIVE_TEAM_KEY).then((stored) => {
      if (stored) setActiveTeamId(stored);
      setInitialized(true);
    });
  }, []);

  // Auto-select first team if stored one is invalid or none stored
  useEffect(() => {
    if (!initialized || teamsLoading || teams.length === 0) return;

    const validIds = teams.map((t) => t.id);
    if (!activeTeamId || !validIds.includes(activeTeamId)) {
      const firstId = teams[0].id;
      setActiveTeamId(firstId);
      AsyncStorage.setItem(ACTIVE_TEAM_KEY, firstId);
    }
  }, [initialized, teamsLoading, teams, activeTeamId]);

  const setActiveTeam = useCallback((team: Team) => {
    setActiveTeamId(team.id);
    AsyncStorage.setItem(ACTIVE_TEAM_KEY, team.id);
  }, []);

  const activeTeam = teams.find((t) => t.id === activeTeamId) ?? teams[0] ?? null;

  return {
    activeTeam,
    teams,
    setActiveTeam,
    isLoading: teamsLoading || !initialized,
  };
}
