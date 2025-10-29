/**
 * Session Auto-Refresh Demo Component
 * Demonstrates the automatic token refresh in action
 */

import { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import { toast } from 'react-hot-toast';

const SessionDemo = () => {
  const [tokenAge, setTokenAge] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate token age timer (starts from 0 when component mounts)
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTokenAge(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastRefresh]);

  const testApiCall = async () => {
    setIsLoading(true);
    try {
      // Make any authenticated API call (e.g., get files)
      const response = await apiClient.get('/getFiles');
      toast.success('✅ API call successful!', { duration: 2000 });
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (error) {
      toast.error(`❌ API call failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTokenStatus = () => {
    if (tokenAge < 60) return { color: 'text-green-500', label: 'Fresh ✅' };
    if (tokenAge < 600) return { color: 'text-yellow-500', label: 'Active 🟡' };
    if (tokenAge < 900) return { color: 'text-orange-500', label: 'Aging 🟠' };
    return { color: 'text-red-500', label: 'Near Expiry 🔴' };
  };

  const status = getTokenStatus();

  return (
    <div className="card bg-base-100 shadow-xl border border-primary/20">
      <div className="card-body">
        <h2 className="card-title text-primary">
          🔄 Session Auto-Refresh Demo
        </h2>
        
        <div className="divider"></div>

        <div className="stats stats-vertical lg:stats-horizontal shadow">
          <div className="stat">
            <div className="stat-figure text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="stat-title">Token Age</div>
            <div className={`stat-value text-2xl ${status.color}`}>
              {formatTime(tokenAge)}
            </div>
            <div className="stat-desc">{status.label}</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="stat-title">Last Refresh</div>
            <div className="stat-value text-2xl">
              {lastRefresh || 'Never'}
            </div>
            <div className="stat-desc">
              {tokenAge >= 900 ? 'Will refresh on next API call' : 'No refresh needed yet'}
            </div>
          </div>
        </div>

        <div className="alert alert-info mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 className="font-bold">How it works:</h3>
            <div className="text-sm">
              • Access tokens expire after <strong>15 minutes</strong><br/>
              • When you make an API call after 15 min, it auto-refreshes<br/>
              • You'll see a toast: "🔄 Refreshing session..." then "✅ Session refreshed!"<br/>
              • Your original request completes seamlessly<br/>
              • Refresh tokens last <strong>7 days</strong>
            </div>
          </div>
        </div>

        <button 
          className={`btn btn-primary mt-4 ${isLoading ? 'loading' : ''}`}
          onClick={testApiCall}
          disabled={isLoading}
        >
          {isLoading ? 'Testing...' : '🧪 Test API Call (Trigger Refresh if Expired)'}
        </button>

        <div className="alert alert-warning mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm">
            <strong>Testing Tip:</strong> Wait 15+ minutes after login, then click the test button. 
            Watch for the auto-refresh toast notification! Or manually expire the token in DevTools cookies.
          </span>
        </div>
      </div>
    </div>
  );
};

export default SessionDemo;
