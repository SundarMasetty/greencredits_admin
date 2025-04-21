import React, { useState } from 'react';
import './UserTable.css';

function UserTable({ users, trips }) {
  console.log("Rendering UserTable",trips);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('email');
  const [sortDirection, setSortDirection] = useState('asc');

  // Calculate trips and credits per user
  const userStats = users.map(user => {
    // Find all trips for this user (assuming trips have a user identifier)
    const userTrips = trips.filter(trip => {
      // Adjust this condition based on how trips are associated with users in your database
      // This assumes there's a userEmail field in the trip document
      return trip.userEmail === user.email || trip.userId === user.id;
    });
    
    const totalCredits = userTrips.reduce((sum, trip) => {
      return sum + (trip.carbonCredits ? Number(trip.carbonCredits) : 0);
    }, 0);
    
    return {
      ...user,
      tripCount: userTrips.length,
      carbonCredits: totalCredits,
      lastActive: userTrips.length > 0 ? 
        userTrips.sort((a, b) => b.lastUpdated - a.lastUpdated)[0].lastUpdated : null
    };
  });


  
  // Sorting logic
  const sortedUsers = [...userStats].sort((a, b) => {
    if (sortField === 'email') {
      return sortDirection === 'asc' 
        ? (a.email || '').localeCompare(b.email || '') 
        : (b.email || '').localeCompare(a.email || '');
    } else if (sortField === 'tripCount') {
      return sortDirection === 'asc' ? a.tripCount - b.tripCount : b.tripCount - a.tripCount;
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

  // Format timestamp function
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    
    // Handle different timestamp formats
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      // Firestore Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      // Already a Date object
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      // ISO string or similar
      date = new Date(timestamp);
    } else {
      return 'Unknown';
    }
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="user-table-container">
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search users by email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      <table className="user-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('email')}>
              Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('tripCount')}>
              Trip Count {sortField === 'tripCount' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('carbonCredits')}>
              Carbon Credits {sortField === 'carbonCredits' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th>Home Location</th>
            <th>Last Active</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan="5" className="no-results">No users found</td>
            </tr>
          ) : (
            filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.email || 'Unknown'}</td>
                <td>{user.tripCount}</td>
                <td>{user.carbonCredits}</td>
                <td>{user.home || 'Not set'}</td>
                <td>{formatTimestamp(user.lastActive || user.lastUpdated)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default UserTable;