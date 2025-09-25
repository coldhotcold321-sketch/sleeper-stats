import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the chart component to avoid SSR issues
const DynamicScatterChart = dynamic(
  () => import('recharts').then((recharts) => {
    const { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } = recharts;
    
    return function Chart({ teamData, avgScored, avgProjected, getQuadrantColor }) {
      const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
            <div style={{ backgroundColor: 'white', padding: '12px', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>{data.name}</p>
              <p style={{ fontSize: '14px', margin: '4px 0' }}>Avg Scored: {data.scoredPoints.toFixed(1)}</p>
              <p style={{ fontSize: '14px', margin: '4px 0' }}>Avg Projected: {data.projectedPoints.toFixed(1)}</p>
              <p style={{ fontSize: '14px', margin: '4px 0' }}>Category: <span style={{ fontWeight: 'bold' }}>{data.quadrant}</span></p>
              <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>Weeks played: {data.weeks}</p>
            </div>
          );
        }
        return null;
      };

      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="scoredPoints" 
              name="Scored Points"
              label={{ value: 'Average Scored Points', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              type="number" 
              dataKey="projectedPoints" 
              name="Projected Points"
              label={{ value: 'Average Projected Points', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine x={avgScored} stroke="#666" strokeDasharray="5 5" />
            <ReferenceLine y={avgProjected} stroke="#666" strokeDasharray="5 5" />
            
            <Scatter data={teamData} fill="#8884d8">
              {teamData.map((entry, index) => (
                <circle 
                  key={index} 
                  r={6} 
                  fill={getQuadrantColor(entry.quadrant)}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      );
    };
  }),
  { 
    ssr: false,
    loading: () => <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>
  }
);

export default function SleeperLuckAnalyzer() {
  const [leagueId, setLeagueId] = useState('');
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leagueInfo, setLeagueInfo] = useState(null);

  const loadDemoData = () => {
    const demoData = [
      { name: "Team Alpha", projectedPoints: 125.8, scoredPoints: 142.3, quadrant: "Lucky Teams", weeks: 12 },
      { name: "Team Bravo", projectedPoints: 118.2, scoredPoints: 115.7, quadrant: "Bad Teams", weeks: 12 },
      { name: "Team Charlie", projectedPoints: 135.6, scoredPoints: 138.9, quadrant: "Good Teams", weeks: 12 },
      { name: "Team Delta", projectedPoints: 129.4, scoredPoints: 108.2, quadrant: "Unlucky Teams", weeks: 12 },
      { name: "Team Echo", projectedPoints: 122.1, scoredPoints: 126.8, quadrant: "Lucky Teams", weeks: 12 },
      { name: "Team Foxtrot", projectedPoints: 131.7, scoredPoints: 133.5, quadrant: "Good Teams", weeks: 12 },
      { name: "Team Golf", projectedPoints: 117.9, scoredPoints: 112.4, quadrant: "Bad Teams", weeks: 12 },
      { name: "Team Hotel", projectedPoints: 128.8, scoredPoints: 119.6, quadrant: "Unlucky Teams", weeks: 12 },
      { name: "Team India", projectedPoints: 124.3, scoredPoints: 131.1, quadrant: "Lucky Teams", weeks: 12 },
      { name: "Team Juliet", projectedPoints: 119.6, scoredPoints: 121.7, quadrant: "Good Teams", weeks: 12 }
    ];

    setTeamData(demoData);
    setLeagueInfo({ name: "Demo League", season: "2024", total_rosters: 10 });
    setError('');
  };

  const fetchLeagueData = async () => {
    if (!leagueId.trim()) {
      setError('Please enter a league ID');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/sleeper?leagueId=${leagueId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }
      
      setTeamData(data.teamData);
      setLeagueInfo(data.leagueInfo);

    } catch (err) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const getQuadrantColor = (quadrant) => {
    switch (quadrant) {
      case 'Good Teams': return '#22c55e';
      case 'Lucky Teams': return '#f59e0b';
      case 'Unlucky Teams': return '#ef4444';
      case 'Bad Teams': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  const avgProjected = teamData.length > 0 
    ? teamData.reduce((sum, team) => sum + team.projectedPoints, 0) / teamData.length 
    : 0;
  const avgScored = teamData.length > 0 
    ? teamData.reduce((sum, team) => sum + team.scoredPoints, 0) / teamData.length 
    : 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', backgroundColor: 'white', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px', color: '#1f2937' }}>
          Fantasy Football Team Luck Analyzer
        </h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '24px' }}>
          Enter your Sleeper league ID to see how lucky your teams have been this season
        </p>
        
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Enter Sleeper League ID"
            value={leagueId}
            onChange={(e) => setLeagueId(e.target.value)}
            style={{ 
              padding: '8px 16px', 
              border: '1px solid #d1d5db', 
              borderRadius: '8px',
              outline: 'none',
              fontSize: '16px',
              minWidth: '200px'
            }}
            onKeyPress={(e) => e.key === 'Enter' && fetchLeagueData()}
          />
          <button
            onClick={fetchLeagueData}
            disabled={loading}
            style={{ 
              padding: '8px 24px', 
              backgroundColor: loading ? '#9ca3af' : '#3b82f6', 
              color: 'white', 
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {loading ? 'Loading...' : 'Analyze'}
          </button>
          <button
            onClick={loadDemoData}
            style={{ 
              padding: '8px 24px', 
              backgroundColor: '#22c55e', 
              color: 'white', 
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Demo
          </button>
        </div>

        {error && (
          <div style={{ color: '#ef4444', textAlign: 'center', marginBottom: '16px', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
            <p style={{ fontWeight: 'bold', margin: 0 }}>Error: {error}</p>
          </div>
        )}

        {leagueInfo && (
          <div style={{ textAlign: 'center', marginBottom: '16px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{leagueInfo.name}</h2>
            <p style={{ color: '#6b7280', margin: 0 }}>Season {leagueInfo.season} • {leagueInfo.total_rosters} teams</p>
          </div>
        )}
      </div>

      {teamData.length > 0 && (
        <div>
          <div style={{ height: '400px', width: '100%', marginBottom: '32px' }}>
            <DynamicScatterChart 
              teamData={teamData}
              avgScored={avgScored}
              avgProjected={avgProjected}
              getQuadrantColor={getQuadrantColor}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', marginBottom: '32px' }}>
            <div style={{ backgroundColor: '#dcfce7', padding: '12px', borderRadius: '8px' }}>
              <div style={{ color: '#166534' }}>GOOD TEAMS</div>
              <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>High Scored, High Projected</div>
            </div>
            <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '8px' }}>
              <div style={{ color: '#92400e' }}>LUCKY TEAMS</div>
              <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>High Scored, Low Projected</div>
            </div>
            <div style={{ backgroundColor: '#fee2e2', padding: '12px', borderRadius: '8px' }}>
              <div style={{ color: '#991b1b' }}>UNLUCKY TEAMS</div>
              <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>Low Scored, High Projected</div>
            </div>
            <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px' }}>
              <div style={{ color: '#374151' }}>BAD TEAMS</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Low Scored, Low Projected</div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Team Rankings</h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              {teamData
                .sort((a, b) => b.scoredPoints - a.scoredPoints)
                .map((team, index) => (
                  <div 
                    key={team.name} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px', 
                      backgroundColor: '#f9fafb', 
                      borderRadius: '8px',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 'bold', color: '#6b7280' }}>#{index + 1}</span>
                      <span style={{ fontWeight: 'medium' }}>{team.name}</span>
                      <span 
                        style={{ 
                          padding: '2px 8px', 
                          fontSize: '12px', 
                          borderRadius: '12px',
                          backgroundColor: getQuadrantColor(team.quadrant) + '33',
                          color: getQuadrantColor(team.quadrant)
                        }}
                      >
                        {team.quadrant}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {team.scoredPoints.toFixed(1)} scored | {team.projectedPoints.toFixed(1)} projected
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '32px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
        <p>Data sourced from Sleeper API • Chart shows average points per week</p>
        <p style={{ marginTop: '4px' }}>
          Find your League ID in your Sleeper app URL: sleeper.app/leagues/[LEAGUE_ID]/team
        </p>
      </div>
    </div>
  );
}
