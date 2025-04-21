import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Creditschart.css';

function Creditschart({ trips }) {
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year'

  useEffect(() => {
    // Generate the chart data based on the selected time range
    const generateChartData = () => {
      if (!trips || trips.length === 0) return [];
      
      const now = new Date();
      let dateFormat, groupingFunction, startDate;
      
      // Set parameters based on time range
      if (timeRange === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        dateFormat = { day: '2-digit', month: 'short' };
        groupingFunction = (date) => `${date.getMonth()}-${date.getDate()}`;
      } else if (timeRange === 'month') {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        dateFormat = { day: '2-digit', month: 'short' };
        groupingFunction = (date) => `${date.getMonth()}-${date.getDate()}`;
      } else { // year
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        dateFormat = { month: 'short', year: 'numeric' };
        groupingFunction = (date) => `${date.getMonth()}-${date.getFullYear()}`;
      }
      
      // Filter trips within the selected time range
      const filteredTrips = trips.filter(trip => {
        if (!trip.lastUpdated) return false;
        
        let tripDate;
        if (trip.lastUpdated.toDate && typeof trip.lastUpdated.toDate === 'function') {
          // Firestore Timestamp
          tripDate = trip.lastUpdated.toDate();
        } else if (typeof trip.lastUpdated === 'string') {
          // String date
          tripDate = new Date(trip.lastUpdated);
        } else {
          return false;
        }
        
        return tripDate >= startDate;
      });
      
      // Group trips by date
      const groupedData = {};
      
      filteredTrips.forEach(trip => {
        if (!trip.lastUpdated) return;
        
        let date;
        if (trip.lastUpdated.toDate && typeof trip.lastUpdated.toDate === 'function') {
          date = trip.lastUpdated.toDate();
        } else if (typeof trip.lastUpdated === 'string') {
          date = new Date(trip.lastUpdated);
        } else {
          return;
        }
        
        const key = groupingFunction(date);
        
        if (!groupedData[key]) {
          groupedData[key] = {
            date,
            carbonCredits: 0,
            tripCount: 0
          };
        }
        
        groupedData[key].carbonCredits += (Number(trip.carbonCredits) || 0);
        groupedData[key].tripCount += 1;
      });
      
      // Convert to array and sort by date
      let dataArray = Object.values(groupedData);
      dataArray.sort((a, b) => a.date - b.date);
      
      // Format dates for display
      dataArray = dataArray.map(item => ({
        ...item,
        formattedDate: item.date.toLocaleDateString('en-US', dateFormat)
      }));
      
      return dataArray;
    };
    
    setChartData(generateChartData());
  }, [trips, timeRange]);

  return (
    <div className="carbon-chart-container">
      <div className="chart-header">
        <h2>Carbon Credits Over Time</h2>
        <div className="chart-controls">
          <button 
            className={timeRange === 'week' ? 'active' : ''} 
            onClick={() => setTimeRange('week')}
          >
            Last Week
          </button>
          <button 
            className={timeRange === 'month' ? 'active' : ''} 
            onClick={() => setTimeRange('month')}
          >
            Last Month
          </button>
          <button 
            className={timeRange === 'year' ? 'active' : ''} 
            onClick={() => setTimeRange('year')}
          >
            Last Year
          </button>
        </div>
      </div>
      
      <div className="chart-wrapper">
        {chartData.length === 0 ? (
          <div className="no-data">No data available for the selected time period</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }} 
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                label={{ value: 'Carbon Credits', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                label={{ value: 'Trip Count', angle: 90, position: 'insideRight' }}
              />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="carbonCredits"
                stroke="#82ca9d"
                name="Carbon Credits"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 8 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="tripCount"
                stroke="#8884d8"
                name="Trip Count"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default Creditschart;