import React, { useState } from 'react';
import './UserTripStatistics.css';

function UserTripStatistics({ users, stats }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('email');
  const [sortDirection, setSortDirection] = useState('asc');

  // Check if stats and stats.userStats are defined
  const userStats = stats?.userStats || [];
  
  // Sorting logic
  const sortedUsers = [...userStats].sort((a, b) => {
    if (sortField === 'email') {
      return sortDirection === 'asc' 
        ? (a.email || '').localeCompare(b.email || '') 
        : (b.email || '').localeCompare(a.email || '');
    } else if (sortField === 'totalTrips') {
      return sortDirection === 'asc' ? a.totalTrips - b.totalTrips : b.totalTrips - a.totalTrips;
    } else if (sortField === 'carbonCredits') {
      return sortDirection === 'asc' ? a.carbonCredits - b.carbonCredits : b.carbonCredits - a.carbonCredits;
    }
    return 0;
  });
  
  // Filtering logic
  const filteredUsers = sortedUsers.filter(user => 
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="user-trip-statistics-container">
      <h1>User Trip Statistics</h1>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search users by email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="user-stats-section">
        <div className="user-stats-table">
          <table className="statistics-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('email')}>
                  User {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('totalTrips')}>
                  Total Trips {sortField === 'totalTrips' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('carbonCredits')}>
                  Carbon Credits {sortField === 'carbonCredits' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Most Used Transport</th>
                <th>Last Trip Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-results">No users found</td>
                </tr>
              ) : (
                filteredUsers.map(userStat => {
                  // Find the most used transport mode
                  const mostUsedTransport = userStat.transportModes
                    ? Object.entries(userStat.transportModes)
                        .sort((a, b) => b[1] - a[1])
                        .map(([mode, count]) => mode)[0] || 'none'
                    : 'none';
                  
                  return (
                    <tr key={userStat.userId}>
                      <td>{userStat.email}</td>
                      <td>{userStat.totalTrips}</td>
                      <td>{userStat.carbonCredits}</td>
                      <td>{mostUsedTransport}</td>
                      <td>
                        {userStat.lastTripDate ? 
                          new Date(userStat.lastTripDate).toLocaleDateString() : 
                          'No trips'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserTripStatistics;