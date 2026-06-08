import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hjbzknaionxkdkiowcch.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYnprbmFpb254a2RraW93Y2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjgxMjAsImV4cCI6MjA4ODc0NDEyMH0.WRE11VHC7-6QJNaPgg-9miDGceDxDmGqPL45-fhI6Ic';

async function setup() {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Try signing up test users (will fail silently if they already exist)
  console.log('Creating test athlete...');
  const { data: athlete, error: aErr } = await sb.auth.signUp({
    email: 'test-playwright@deco.app',
    password: 'TestPass123!',
    options: { data: { full_name: 'Test Athlete', role: 'athlete' } },
  });
  if (aErr) console.log('Athlete:', aErr.message);
  else console.log('Athlete created:', athlete.user?.id);

  console.log('Creating test coach...');
  const { data: coach, error: cErr } = await sb.auth.signUp({
    email: 'test-coach@deco.app',
    password: 'TestPass123!',
    options: { data: { full_name: 'Test Coach', role: 'coach' } },
  });
  if (cErr) console.log('Coach:', cErr.message);
  else console.log('Coach created:', coach.user?.id);

  // Now sign in to verify they work
  console.log('\nVerifying sign-in...');
  const { data: aLogin, error: aLoginErr } = await sb.auth.signInWithPassword({
    email: 'test-playwright@deco.app',
    password: 'TestPass123!',
  });
  console.log('Athlete login:', aLoginErr ? aLoginErr.message : `OK (${aLogin.user?.id})`);

  const { data: cLogin, error: cLoginErr } = await sb.auth.signInWithPassword({
    email: 'test-coach@deco.app',
    password: 'TestPass123!',
  });
  console.log('Coach login:', cLoginErr ? cLoginErr.message : `OK (${cLogin.user?.id})`);

  // If sign-in worked, update helpers with actual IDs and set up team
  if (aLogin.user && cLogin.user) {
    console.log('\n--- UPDATE tests/helpers.ts with these IDs ---');
    console.log(`ATHLETE_ID = '${aLogin.user.id}'`);
    console.log(`COACH_ID = '${cLogin.user.id}'`);

    // Set profiles via athlete's session
    const athleteClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      db: { schema: 'deco' },
      global: { headers: { Authorization: `Bearer ${aLogin.session!.access_token}` } },
    });
    await athleteClient.from('profiles').update({ role: 'athlete', onboarding_completed: true }).eq('id', aLogin.user.id);

    const coachClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      db: { schema: 'deco' },
      global: { headers: { Authorization: `Bearer ${cLogin.session!.access_token}` } },
    });
    await coachClient.from('profiles').update({ role: 'coach', onboarding_completed: true }).eq('id', cLogin.user.id);

    // Check if they share a team already
    const { data: athleteTeams } = await athleteClient.from('team_members').select('team_id').eq('athlete_id', aLogin.user.id);
    const { data: coachTeams } = await coachClient.from('team_coaches').select('team_id').eq('coach_id', cLogin.user.id);

    console.log('Athlete teams:', athleteTeams?.length ?? 0);
    console.log('Coach teams:', coachTeams?.length ?? 0);

    // Create team if needed
    if (!coachTeams || coachTeams.length === 0) {
      console.log('Creating test team via coach...');
      const { data: team, error: tErr } = await coachClient.rpc('create_team_with_coach', { team_name: 'PW Test Team' });
      if (tErr) console.log('Team creation error:', tErr.message);
      else console.log('Team created');
    }

    // Join athlete to coach's team
    const { data: cTeams2 } = await coachClient.from('team_coaches').select('team_id').eq('coach_id', cLogin.user.id);
    if (cTeams2 && cTeams2.length > 0 && (!athleteTeams || athleteTeams.length === 0)) {
      const teamId = cTeams2[0].team_id;
      // Get invite code
      const { data: teamData } = await coachClient.from('teams').select('invite_code').eq('id', teamId).single();
      if (teamData) {
        console.log(`Joining athlete to team with code: ${teamData.invite_code}`);
        await athleteClient.from('team_members').insert({ team_id: teamId, athlete_id: aLogin.user.id });
      }
    }

    // Create test goal
    const { error: gErr } = await athleteClient.from('goals').insert({
      athlete_id: aLogin.user.id,
      title: 'Test Goal PW',
      status: 'active',
    });
    if (gErr && !gErr.message.includes('duplicate')) console.log('Goal error:', gErr.message);

    // Create XP event
    await athleteClient.from('xp_events').insert({
      athlete_id: aLogin.user.id,
      event_type: 'goal_created',
      points: 25,
    });

    console.log('\n✅ Setup complete!');
  }
}

setup().catch(console.error);
