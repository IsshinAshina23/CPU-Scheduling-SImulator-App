import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function App() {
  const [processes, setProcesses] = useState([]);
  const [algorithm, setAlgorithm] = useState('FCFS');
  const [output, setOutput] = useState(null);
  const [newProcess, setNewProcess] = useState({ id: '', arrivalTime: '', burstTime: '' });
  const [simData, setSimData] = useState([]);
  const timerRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProcess({ ...newProcess, [name]: value });
  };

  const addProcess = () => {
    if (!newProcess.id || newProcess.arrivalTime === '' || newProcess.burstTime === '') return;
    setProcesses([...processes, {
      id: newProcess.id,
      arrivalTime: parseInt(newProcess.arrivalTime),
      burstTime: parseInt(newProcess.burstTime),
    }]);
    setNewProcess({ id: '', arrivalTime: '', burstTime: '' });
  };

  const handleRun = async () => {
    if (processes.length === 0) {
      alert("Please add at least one process.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/schedule', {
        processes,
        algorithm,
      });

      if (response.data.error) {
        alert(response.data.error);
        return;
      }

      setOutput(response.data);
      setSimData([]);
    } catch (error) {
      console.error("Error running the scheduling algorithm:", error);
    }
  };

  const simulateExecution = () => {
    if (!output || !output.result) return;
    setSimData([]);
    let index = 0;

    timerRef.current = setInterval(() => {
      if (index >= output.result.length) {
        clearInterval(timerRef.current);
        return;
      }

      const currentProcess = output.result[index];
      if (currentProcess && currentProcess.id) {
        setSimData(prev => [...prev, {
          name: currentProcess.id,
          duration: currentProcess.end - currentProcess.start
        }]);
      }

      index++;
    }, 1000);
  };

  return (
    <div className="app-container">
      <h1>CPU Scheduling Simulator</h1>

      <div className="input-section">
        <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
          <option value="FCFS">FCFS</option>
          <option value="SJF-Non-Preemptive">SJF (Non-Preemptive)</option>
          <option value="SJF-Preemptive">SJF (Preemptive)</option>
          <option value="SRJF">SRJF</option>
        </select>

        <div className="process-input">
          <input type="text" name="id" placeholder="Process ID" value={newProcess.id} onChange={handleChange} />
          <input type="number" name="arrivalTime" placeholder="Arrival Time" value={newProcess.arrivalTime} onChange={handleChange} />
          <input type="number" name="burstTime" placeholder="Burst Time" value={newProcess.burstTime} onChange={handleChange} />
          <button onClick={addProcess}>Add Process</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>PID</th>
              <th>Arrival Time</th>
              <th>Burst Time</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p, i) => (
              <tr key={i}>
                <td>{p.id}</td>
                <td>{p.arrivalTime}</td>
                <td>{p.burstTime}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={handleRun}>Run</button>
        <button onClick={simulateExecution} style={{ marginLeft: '10px' }}>Simulate</button>
        <button onClick={() => setProcesses([])} style={{ marginLeft: '10px' }}>Clear All</button>

      </div>

      {output && (
        <div className="output-section">
          <h2>Gantt Chart (Real-Time)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={simData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" label={{ value: 'Process', position: 'insideBottomRight', offset: 0 }} />
              <YAxis label={{ value: 'Time', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="duration" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
          <p>Avg Waiting Time: {output.avgWaitingTime.toFixed(2)}</p>
          <p>Avg Turnaround Time: {output.avgTurnaroundTime.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}

export default App;