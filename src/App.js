// import React, { useState, useEffect } from 'react';
// import Dashboard from './components/Dashboard';
// import { auth } from './firebase/config';
// import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
// import './App.css';

// function App() {
//   const [user, setUser] = useState(null);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setUser(user);
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       await signInWithEmailAndPassword(auth, email, password);
//     } catch (error) {
//       alert('Login failed: ' + error.message);
//     }
//   };

//   const handleLogout = async () => {
//     try {
//       await signOut(auth);
//     } catch (error) {
//       console.error('Logout failed:', error);
//     }
//   };

//   if (loading) {
//     return <div className="loading">Loading...</div>;
//   }

//   if (!user) {
//     return (
//       <div className="login-container">
//         <h1>GreenCredits Admin</h1>
//         <form onSubmit={handleLogin} className="login-form">
//           <div className="form-group">
//             <label>Email</label>
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label>Password</label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />
//           </div>
//           <button type="submit" className="login-button">Login</button>
//         </form>
//       </div>
//     );
//   }

//   return (
//     <div className="app">
//       <header className="app-header">
//         <h1>GreenCredits Admin Dashboard</h1>
//         <button onClick={handleLogout} className="logout-button">Logout</button>
//       </header>
//       <Dashboard />
//     </div>
//   );
// }

// export default App;
// src/App.js
import React from 'react';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>GreenCredits Admin Dashboard</h1>
      </header>
      <Dashboard />
    </div>
  );
}

export default App;