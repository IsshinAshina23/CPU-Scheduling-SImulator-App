const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// FCFS
const scheduleFCFS = (processes) => {
  let time = 0;
  let result = [];
  let totalWaiting = 0;
  let totalTurnaround = 0;

  processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

  processes.forEach((p) => {
    if (time < p.arrivalTime) time = p.arrivalTime;
    const start = time;
    const end = time + p.burstTime;
    const turnaroundTime = end - p.arrivalTime;
    const waitingTime = start - p.arrivalTime;
    totalWaiting += waitingTime;
    totalTurnaround += turnaroundTime;
    result.push({ ...p, start, end, waitingTime, turnaroundTime });
    time = end;
  });

  return {
    result,
    avgWaitingTime: totalWaiting / processes.length,
    avgTurnaroundTime: totalTurnaround / processes.length,
  };
};

// SJF (Non-Preemptive)
const scheduleSJFNonPreemptive = (processes) => {
  let time = 0;
  let result = [];
  let totalWaiting = 0;
  let totalTurnaround = 0;
  processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

  const readyQueue = [];

  while (processes.length || readyQueue.length) {
    while (processes.length && processes[0].arrivalTime <= time) {
      readyQueue.push(processes.shift());
    }

    if (readyQueue.length > 0) {
      readyQueue.sort((a, b) => a.burstTime - b.burstTime);
      const currentProcess = readyQueue.shift();
      const start = time;
      const end = time + currentProcess.burstTime;
      const turnaroundTime = end - currentProcess.arrivalTime;
      const waitingTime = start - currentProcess.arrivalTime;
      totalWaiting += waitingTime;
      totalTurnaround += turnaroundTime;
      result.push({ ...currentProcess, start, end, waitingTime, turnaroundTime });
      time = end;
    } else {
      time++;
    }
  }

  return {
    result,
    avgWaitingTime: totalWaiting / result.length,
    avgTurnaroundTime: totalTurnaround / result.length,
  };
};

// SJF (Preemptive) - Fixed
const scheduleSJFPreemptive = (processes) => {
  let time = 0;
  let result = [];
  let completed = [];
  let totalWaiting = 0;
  let totalTurnaround = 0;
  let lastProcessId = null;

  processes = processes.map(p => ({ ...p, remainingTime: p.burstTime }));
  processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

  while (processes.length || result.length) {
    const readyQueue = [...result, ...processes.filter(p => p.arrivalTime <= time)];
    readyQueue.sort((a, b) => a.remainingTime - b.remainingTime);

    const currentProcess = readyQueue.find(p => p.remainingTime > 0);

    if (currentProcess) {
      if (lastProcessId !== currentProcess.id) {
        currentProcess.start = time;
        lastProcessId = currentProcess.id;
      }

      currentProcess.remainingTime--;
      time++;

      if (currentProcess.remainingTime === 0) {
        currentProcess.end = time;
        currentProcess.turnaroundTime = currentProcess.end - currentProcess.arrivalTime;
        currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
        totalWaiting += currentProcess.waitingTime;
        totalTurnaround += currentProcess.turnaroundTime;
        completed.push({ ...currentProcess });
        processes = processes.filter(p => p.id !== currentProcess.id);
        result = result.filter(p => p.id !== currentProcess.id);
      } else {
        if (!result.some(p => p.id === currentProcess.id)) {
          result.push(currentProcess);
          processes = processes.filter(p => p.id !== currentProcess.id);
        }
      }
    } else {
      time++;
    }
  }

  return {
    result: completed,
    avgWaitingTime: totalWaiting / completed.length,
    avgTurnaroundTime: totalTurnaround / completed.length,
  };
};

// SRJF (Alias of SJF Preemptive)
const scheduleSRJF = scheduleSJFPreemptive;

app.post('/schedule', (req, res) => {
  const { processes, algorithm } = req.body;
  let output;

  switch (algorithm) {
    case 'FCFS':
      output = scheduleFCFS(processes);
      break;
    case 'SJF-Non-Preemptive':
      output = scheduleSJFNonPreemptive(processes);
      break;
    case 'SJF-Preemptive':
      output = scheduleSJFPreemptive(processes);
      break;
    case 'SRJF':
      output = scheduleSRJF(processes);
      break;
    default:
      return res.status(400).json({ error: 'Unsupported algorithm' });
  }

  res.json(output);
});

app.listen(5000, () => console.log('Server running on port 5000'));