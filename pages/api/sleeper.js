export default async function handler(req, res) {
  const { leagueId } = req.query;
  
  if (!leagueId) {
    return res.status(400).json({ error: 'League ID is required' });
  }

  try {
    // Fetch league info
    const leagueResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`);
    if (!leagueResponse.ok) throw new Error('League not found');
    const league = await leagueResponse.json();

    // Fetch users
    const usersResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`);
    const users = await usersResponse.json();

    // Fetch rosters
    const rostersResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
    const rosters = await rostersResponse.json();

    // Get current week
    const currentWeek = Math.min(league.settings.playoff_week_start - 1, 18);
    
    // Fetch matchups for all weeks
    const matchupPromises = [];
    for (let week = 1; week <= currentWeek; week++) {
      matchupPromises.push(
        fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`)
          .then(res => res.json())
      );
    }

    const allMatchups = await Promise.all(matchupPromises);

    // Process data
    const teamStats = {};

    rosters.forEach(roster => {
      const user = users.find(u => u.user_id === roster.owner_id);
      teamStats[roster.roster_id] = {
        teamName: user?.display_name || `Team ${roster.roster_id}`,
        totalProjected: 0,
        totalScored: 0,
        weeks: 0
      };
    });

    allMatchups.forEach((weekMatchups) => {
      if (weekMatchups && Array.isArray(weekMatchups)) {
        weekMatchups.forEach(matchup => {
          if (matchup.points && matchup.points_bonus_projection) {
            const team = teamStats[matchup.roster_id];
            if (team) {
              team.totalProjected += matchup.points_bonus_projection || 0;
              team.totalScored += matchup.points || 0;
              team.weeks++;
            }
          }
        });
      }
    });

    const chartData = Object.values(teamStats)
      .filter(team => team.weeks > 0)
      .map(team => ({
        name: team.teamName,
        projectedPoints: team.totalProjected / team.weeks,
        scoredPoints: team.totalScored / team.weeks,
        totalProjected: team.totalProjected,
        totalScored: team.totalScored,
        weeks: team.weeks
      }));

    const avgProjected = chartData.reduce((sum, team) => sum + team.projectedPoints, 0) / chartData.length;
    const avgScored = chartData.reduce((sum, team) => sum + team.scoredPoints, 0) / chartData.length;

    const getQuadrant = (scored, projected, avgScored, avgProjected) => {
      if (scored >= avgScored && projected >= avgProjected) return 'Good Teams';
      if (scored >= avgScored && projected < avgProjected) return 'Lucky Teams';
      if (scored < avgScored && projected >= avgProjected) return 'Unlucky Teams';
      return 'Bad Teams';
    };

    const dataWithQuadrants = chartData.map(team => ({
      ...team,
      quadrant: getQuadrant(team.scoredPoints, team.projectedPoints, avgScored, avgProjected)
    }));

    res.status(200).json({
      teamData: dataWithQuadrants,
      leagueInfo: {
        name: league.name,
        season: league.season,
        total_rosters: league.total_rosters
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}