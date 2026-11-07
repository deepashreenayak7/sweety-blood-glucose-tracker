
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import './App.css';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user') || 'null')
  );

  const [readings, setReadings] = useState([]);
  const [readingDate, setReadingDate] = useState(
    new Date().toLocaleDateString('en-CA')
  );
  const [readingType, setReadingType] = useState('Morning fasting');
  const [glucoseLevel, setGlucoseLevel] = useState('');
  const [readingMessage, setReadingMessage] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [reportDate, setReportDate] = useState(
    new Date().toLocaleDateString('en-CA')
  );
  const [report, setReport] = useState(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportMessage, setReportMessage] = useState('');

  // Prepare readings for the chart
  const chartData = [...readings]
    .sort((a, b) => {
      const dateA = String(a.reading_date).slice(0, 10);
      const dateB = String(b.reading_date).slice(0, 10);
      return dateA.localeCompare(dateB);
    })
    .map((reading) => ({
      label: `${String(reading.reading_date).slice(0, 10)} - ${reading.reading_type}`,
      glucose: Number(reading.glucose_level)
    }));

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');

    const url = isLogin
      ? 'http://localhost:5000/login'
      : 'http://localhost:5000/register';

    const body = isLogin
      ? { email, password }
      : { name, email, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Something went wrong');
        return;
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setToken(data.token);
        setUser(data.user);
        loadReadings(data.token);
      } else {
        setMessage('Registration successful! Please login.');
        setIsLogin(true);
        setName('');
        setPassword('');
      }
    } catch (error) {
      setMessage('Cannot connect to server. Please try again.');
    }
  }

  async function loadReadings(authToken) {
    try {
      const response = await fetch('http://localhost:5000/readings', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setReadings(Array.isArray(data) ? data : data.readings || []);
      }
    } catch (error) {
      console.log('Could not load readings');
    }
  }

  async function handleAddReading(e) {
    e.preventDefault();
    setReadingMessage('');

    const url = editingId
      ? `http://localhost:5000/readings/${editingId}`
      : 'http://localhost:5000/readings';

    try {
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reading_date: readingDate,
          reading_type: readingType,
          glucose_level: Number(glucoseLevel)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setReadingMessage(data.message || 'Could not save reading');
        return;
      }

      setReadingMessage(
        editingId
          ? 'Reading updated successfully!'
          : 'Reading added successfully!'
      );

      setEditingId(null);
      setGlucoseLevel('');
      setReadingDate(new Date().toLocaleDateString('en-CA'));
      setReadingType('Morning fasting');

      loadReadings(token);
    } catch (error) {
      setReadingMessage('Cannot connect to server.');
    }
  }

  function handleEdit(reading) {
    setEditingId(reading.id);
    setReadingDate(String(reading.reading_date).slice(0, 10));
    setReadingType(reading.reading_type);
    setGlucoseLevel(reading.glucose_level);
    setReadingMessage('');
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this reading?')) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/readings/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setReadingMessage(data.message || 'Could not delete reading');
        return;
      }

      setReadingMessage('Reading deleted successfully!');
      loadReadings(token);
    } catch (error) {
      setReadingMessage('Cannot connect to server.');
    }
  }

  async function fetchReport(endpoint, title) {
    setReportMessage('');
    setReport(null);
    setReportTitle(title);

    try {
      const response = await fetch(
        `http://localhost:5000${endpoint}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setReportMessage(data.message || 'Could not fetch report');
        return;
      }

      setReport(data);
    } catch (error) {
      setReportMessage('Cannot connect to server.');
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setToken(null);
    setUser(null);
    setReadings([]);
    setReport(null);
  }

  function showValue(value) {
    return value === null || value === undefined ? '—' : value;
  }

  if (token) {
    return (
      <div className="app">
        <h1>Sweety</h1>
        <p>Blood Glucose Tracker</p>

        <div className="dashboard">
          <div className="dashboard-header">
            <h2>Welcome, {user?.name || 'User'}!</h2>
            <button onClick={handleLogout}>Logout</button>
          </div>

          <h3>{editingId ? 'Edit Glucose Reading' : 'Add Glucose Reading'}</h3>

          <form onSubmit={handleAddReading} className="reading-form">
            <label>Date</label>
            <input
              type="date"
              value={readingDate}
              max={new Date().toLocaleDateString('en-CA')}
              onChange={(e) => setReadingDate(e.target.value)}
              required
            />

            <label>Reading Type</label>
            <select
              value={readingType}
              onChange={(e) => setReadingType(e.target.value)}
            >
              <option>Morning fasting</option>
              <option>After breakfast</option>
              <option>After lunch</option>
              <option>After dinner</option>
            </select>

            <label>Glucose Level (mg/dL)</label>
            <input
              type="number"
              min="40"
              max="600"
              step="1"
              placeholder="Enter glucose level"
              value={glucoseLevel}
              onChange={(e) => setGlucoseLevel(e.target.value)}
              required
            />

            <button type="submit">
              {editingId ? 'Update Reading' : 'Add Reading'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setGlucoseLevel('');
                  setReadingMessage('');
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>

          {readingMessage && <p>{readingMessage}</p>}

          <h3>Your Glucose Readings</h3>
          <p>Total readings: {readings.length}</p>

          {readings.length === 0 ? (
            <p>No readings available yet.</p>
          ) : (
            readings.map((reading) => (
              <div className="reading-card" key={reading.id}>
                <strong>{reading.reading_type}</strong>
                <p>{reading.glucose_level} mg/dL</p>
                <small>
                  {String(reading.reading_date).slice(0, 10)}
                </small>

                <div>
                  <button onClick={() => handleEdit(reading)}>Edit</button>
                  <button onClick={() => handleDelete(reading.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}

          <hr />

          {/* Monthly Glucose Trend Chart */}
          <h3>Monthly Glucose Trend</h3>

          {chartData.length === 0 ? (
            <p>Add glucose readings to see your trend chart.</p>
          ) : (
            <div
              style={{
                width: '100%',
                height: '320px',
                marginTop: '20px'
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 10,
                    bottom: 90
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="label"
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                    height={100}
                    tick={{ fontSize: 10 }}
                  />

                  <YAxis
                    domain={['auto', 'auto']}
                    label={{
                      value: 'Glucose (mg/dL)',
                      angle: -90,
                      position: 'insideLeft'
                    }}
                  />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="glucose"
                    stroke="#6c4ab6"
                    strokeWidth={3}
                    activeDot={{ r: 7 }}
                    name="Glucose Level"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <hr />

          <h3>Glucose Reports</h3>

          <label>Select date for Daily Report</label>
          <input
            type="date"
            value={reportDate}
            max={new Date().toLocaleDateString('en-CA')}
            onChange={(e) => setReportDate(e.target.value)}
          />

          <button
            onClick={() =>
              fetchReport(
                `/reports/daily?date=${reportDate}`,
                'Daily Report'
              )
            }
          >
            Daily Report
          </button>

          <button
            onClick={() =>
              fetchReport('/reports/month-to-date', 'Month-to-Date Report')
            }
          >
            Month-to-Date Report
          </button>

          <button
            onClick={() =>
              fetchReport('/reports/previous-month', 'Previous Month Report')
            }
          >
            Previous Month Report
          </button>

          {reportMessage && <p>{reportMessage}</p>}

          {report && (
            <div className="report-card">
              <h3>{reportTitle}</h3>

              <p>
                Highest: {showValue(report.summary?.highest)}
              </p>

              <p>
                Lowest: {showValue(report.summary?.lowest)}
              </p>

              <p>
                Average: {showValue(report.summary?.average)}
              </p>

              <p>
                Total readings: {showValue(report.summary?.total_readings)}
              </p>

              {reportTitle === 'Daily Report' && (
                <>
                  <h4>Readings</h4>

                  {report.readings?.length > 0 ? (
                    report.readings.map((reading) => (
                      <p key={reading.id}>
                        {reading.reading_type}: {reading.glucose_level} mg/dL
                      </p>
                    ))
                  ) : (
                    <p>No readings for this date.</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>Sweety</h1>
      <p>Blood Glucose Tracker</p>

      <div className="login-box">
        <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>

        <p>
          {isLogin
            ? 'Login to track your glucose levels'
            : 'Register to get started'}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <label>Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </>
          )}

          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        {message && <p>{message}</p>}

        <p>
          {isLogin
            ? "Don't have an account? "
            : 'Already have an account? '}

          <span
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage('');
            }}
            style={{
              color: '#6c4ab6',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default App;
