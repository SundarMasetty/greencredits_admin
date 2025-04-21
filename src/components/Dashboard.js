import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import UserTable from './UserTable';
import TripStats from './TripStats';
import CarbonCreditsChart from './Creditschart';
import './Dashboard.css';
// Remove UserTripStatistics import as we're integrating it directly

function Dashboard() {
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrips: 0,
    totalCarbonCredits: 0,
    averageCarbonCreditsPerUser: 0,
    userStats: [] // New field to store per-user statistics
  });
  
  // State for user statistics sorting and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('email');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Starting data fetch...");
        
        // Fetch users from users_data collection
        const usersCollection = collection(db, 'users_data');
        const userSnapshot = await getDocs(usersCollection);
        const usersList = userSnapshot.docs.map(doc => ({
          id: doc.id,
          email: doc.id,
          ...doc.data()
        }));
        console.log("Users fetched:", usersList.length);
        
        let tripsList = [];
        let userStatsList = [];
        
        // Fetch trips for each user
        for (const user of usersList) {
          try {
            // Check if there's a subcollection called 'trips' under this user
            const userTripsCollection = collection(db, 'users_data', user.id, 'trips');
            const userTripsSnapshot = await getDocs(userTripsCollection);
            
            if (!userTripsSnapshot.empty) {
              console.log(`Found trips subcollection for user ${user.id}: ${userTripsSnapshot.docs.length} trips`);
              
              const userTrips = userTripsSnapshot.docs.map(doc => {
                const data = doc.data();
                
                // Process timestamp fields
                const createdAt = data.createdAt ? data.createdAt.toDate() : null;
                const startTime = data.startTime ? data.startTime.toDate() : null;
                
                return {
                  id: doc.id,
                  userId: user.id,
                  createdAt: createdAt,
                  startTime: startTime,
                  status: data.status || '',
                  transportMode: data.transportMode || '',
                  carbonCredits: data.carbonCredits || 0,
                  ...data
                };
              });
              
              // Calculate trip statistics for this user
              const userCarbonCredits = userTrips.reduce((sum, trip) => {
                const credits = trip.carbonCredits ? Number(trip.carbonCredits) : 0;
                return sum + credits;
              }, 0);
              
              // Count trips by transport mode
              const transportModes = {};
              userTrips.forEach(trip => {
                const mode = trip.transportMode || 'unknown';
                transportModes[mode] = (transportModes[mode] || 0) + 1;
              });
              
              // Count trips by status
              const tripStatuses = {};
              userTrips.forEach(trip => {
                const status = trip.status || 'unknown';
                tripStatuses[status] = (tripStatuses[status] || 0) + 1;
              });
              
              // Store user stats
              userStatsList.push({
                userId: user.id,
                email: user.email,
                totalTrips: userTrips.length,
                carbonCredits: userCarbonCredits,
                transportModes,
                tripStatuses,
                // lastTripDate: userTrips.length > 0 ? 
                //   Math.max(...userTrips.filter(t => t.createdAt).map(t => t.createdAt.getTime())) : 
                //   null
              });
              
              tripsList = [...tripsList, ...userTrips];
            } else {
              // Add user with no trips to stats
              userStatsList.push({
                userId: user.id,
                email: user.email,
                totalTrips: 0,
                carbonCredits: 0,
                transportModes: {},
                tripStatuses: {},
                lastTripDate: null
              });
            }
          } catch (userTripErr) {
            console.error(`Error fetching trips for user ${user.id}:`, userTripErr);
            
            // Add user with error to stats
            userStatsList.push({
              userId: user.id,
              email: user.email,
              totalTrips: 0,
              carbonCredits: 0,
              transportModes: {},
              tripStatuses: {},
              lastTripDate: null,
              error: userTripErr.message
            });
          }
        }
        
        console.log("Final trips count:", tripsList.length);
        console.log("User stats:", userStatsList);
        
        setTrips(tripsList);
        
        // Associate trips with users
        const usersWithTripsData = usersList.map(user => {
          const userTrips = tripsList.filter(trip => trip.userId === user.id);
          const userStats = userStatsList.find(stats => stats.userId === user.id) || {
            totalTrips: 0,
            carbonCredits: 0
          };
          
          return {
            ...user,
            trips: userTrips,
            tripCount: userTrips.length,
            totalCarbonCredits: userStats.carbonCredits,
            transportModes: userStats.transportModes || {},
            tripStatuses: userStats.tripStatuses || {},
            lastTripDate: userStats.lastTripDate
          };
        });
        
        setUsers(usersWithTripsData);
        
        // Calculate total carbon credits
        const totalCarbonCredits = userStatsList.reduce((sum, stat) => sum + stat.carbonCredits, 0);
        
        // Calculate total trips
        const totalTrips = userStatsList.reduce((sum, stat) => sum + stat.totalTrips, 0);
        
        // Most popular transport mode
        const allTransportModes = {};
        userStatsList.forEach(userStat => {
          Object.entries(userStat.transportModes).forEach(([mode, count]) => {
            allTransportModes[mode] = (allTransportModes[mode] || 0) + count;
          });
        });
        
        const mostPopularMode = Object.entries(allTransportModes)
          .sort((a, b) => b[1] - a[1])
          .map(([mode, count]) => mode)[0] || 'none';
        
        setStats({
          totalUsers: usersList.length,
          totalTrips: totalTrips,
          totalCarbonCredits: totalCarbonCredits,
          averageCarbonCreditsPerUser: usersList.length ? (totalCarbonCredits / usersList.length).toFixed(2) : 0,
          averageTripsPerUser: usersList.length ? (totalTrips / usersList.length).toFixed(2) : 0,
          mostPopularTransportMode: mostPopularMode,
          userStats: userStatsList
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load dashboard data: " + err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sort and filter handler functions for user stats
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


  // Get sorted and filtered user stats
  const getSortedFilteredUserStats = () => {
    // Make sure stats.userStats exists
    if (!stats.userStats) return [];
    
    // Sort the users
    const sortedUsers = [...stats.userStats].sort((a, b) => {
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
    
    // Filter the users
    return sortedUsers.filter(user => 
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Get the filtered and sorted user stats
  const filteredUserStats = getSortedFilteredUserStats();

  return (
    <div className="dashboard">
      <div className="stats-summary">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{stats.totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>Total Trips</h3>
          <p className="stat-number">{stats.totalTrips}</p>
        </div>
        <div className="stat-card">
          <h3>Total Carbon Credits</h3>
          <p className="stat-number">{stats.totalCarbonCredits}</p>
        </div>
        <div className="stat-card">
          <h3>Avg. Credits Per User</h3>
          <p className="stat-number">{stats.averageCarbonCreditsPerUser}</p>
        </div>
      </div>
      
      <div className="dashboard-charts">
        <CarbonCreditsChart users={users} trips={trips} />
        <TripStats trips={trips} />
      </div>
      
      
      <div className="user-stats-section">
        <h2>User Trip Statistics</h2>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search users by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="user-stats-table">
          <table>
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
              </tr>
            </thead>
            <tbody>
              {filteredUserStats.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-results">No users found</td>
                </tr>
              ) : (
                filteredUserStats.map(userStat => {
                  // Find the most used transport mode
                  const mostUsedTransport = userStat.transportModes
                    ? Object.entries(userStat.transportModes)
                        .sort((a, b) => b[1] - a[1])
                        .map(([mode, count]) => mode)[0] || 'none'
                    : 'none';
                    let Transport = mostUsedTransport.split(".");
                    Transport = Transport[1];
                    console.log(Transport);
                  
                  return (
                    <tr key={userStat.userId}>
                      <td>{userStat.email}</td>
                      <td>{userStat.totalTrips}</td>
                      <td>{userStat.carbonCredits}</td>
                      <td>{Transport}</td>
                     
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

export default Dashboard;