import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AddTrade from './pages/AddTrade';
import TradeDetails from './pages/TradeDetails';
import Profile from './pages/Profile';
import Records from './pages/Records';
import Navigation from './components/Navigation';
import MatrixBackground from './components/MatrixBackground';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ThemeProvider>
            <div className="app-layout">
              <MatrixBackground />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/add" element={<AddTrade />} />
                  <Route path="/trade/:id" element={<TradeDetails />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/records" element={<Records />} />
                </Routes>
              </main>
              <Navigation />
            </div>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
