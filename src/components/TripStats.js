import React, { useState, useEffect } from 'react';
import './TripStats.css';

function TripStats({ trips }) {
  const [timeFilter, setTimeFilter] = useState('all');
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalDistance: 0,
    averageCarbonSaved: 0,
    transportTypes: {}
  });

  useEffect(() => {
    // Filter trips based on selected time period
    let filteredTrips = [...trips];
    const now = new Date();
    
    if (timeFilter === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredTrips = trips.filter(trip => {
        if (!trip.lastUpdated) return false;
        
        let tripDate;
        if (trip.lastUpdated.toDate && typeof trip.lastUpdated.toDate === 'function') {
          tripDate = trip.lastUpdated.toDate();
        } else if (typeof trip.lastUpdated === 'string') {
          tripDate = new Date(trip.lastUpdated);
        } else {
          return false;
        }
        
        return tripDate >= oneWeekAgo;
      });
    } else if (timeFilter === 'month') {
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filteredTrips = trips.filter(trip => {
        if (!trip.lastUpdated) return false;
        
        let tripDate;
        if (trip.lastUpdated.toDate && typeof trip.lastUpdated.toDate === 'function') {
          tripDate = trip.lastUpdated.toDate();
        } else if (typeof trip.lastUpdated === 'string') {
          tripDate = new Date(trip.lastUpdated);
        } else {
          return false;
        }
        
        return tripDate >= oneMonthAgo;
      });
    }
    
    // Calculate statistics
    const totalDistance = filteredTrips.reduce((sum, trip) => {
      return sum + (trip.distance ? Number(trip.distance) : 0);
    }, 0);
    
    const totalCarbonSaved = filteredTrips.reduce((sum, trip) => {
      return sum + (trip.carbonCredits ? Number(trip.carbonCredits) : 0);
    }, 0);
    
    // Count by transport type
    const transportTypes = {};
    filteredTrips.forEach(trip => {
      const type = trip.transportType || 'Unknown';
      transportTypes[type] = (transportTypes[type] || 0) + 1;
    });
    
    setStats({
      totalTrips: filteredTrips.length,
      totalDistance: totalDistance.toFixed(2),
      averageCarbonSaved: filteredTrips.length ? (totalCarbonSaved / filteredTrips.length).toFixed(2) : 0,
      transportTypes
    });
  }, [trips, timeFilter]);

  return (
    <div className="trip-stats-card">
      <div className="card-header">
        <h2>Trip Statistics</h2>
        <div className="time-filter">
          <button 
            className={timeFilter === 'all' ? 'active' : ''} 
            onClick={() => setTimeFilter('all')}
          >
            All Time
          </button>
          <button 
            className={timeFilter === 'month' ? 'active' : ''} 
            onClick={() => setTimeFilter('month')}
          >
            Last Month
          </button>
          <button 
            className={timeFilter === 'week' ? 'active' : ''} 
            onClick={() => setTimeFilter('week')}
          >
            Last Week
          </button>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-item">
          <h3>Total Trips</h3>
          <p>{stats.totalTrips}</p>
        </div>
        <div className="stat-item">
          <h3>Total Distance</h3>
          <p>{stats.totalDistance} miles</p>
        </div>
        <div className="stat-item">
          <h3>Avg Carbon Credits</h3>
          <p>{stats.averageCarbonSaved}</p>
        </div>
      </div>
      
      <div className="transport-breakdown">
        <h3>Transport Types</h3>
        {Object.keys(stats.transportTypes).length === 0 ? (
          <p className="no-data">No transport data available</p>
        ) : (
          <div className="transport-types-list">
            {Object.entries(stats.transportTypes).map(([type, count]) => (
              <div key={type} className="transport-type-item">
                <span className="transport-type">{type}</span>
                <span className="transport-count">{count} trips</span>
                <div className="progress-bar">
                  <div className="progress" style={{ width: `${(count / stats.totalTrips) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TripStats;