let jobCounter = 1;

    function addProcess() {
      const tableBody = document.getElementById("process-table").querySelector("tbody"); // More efficient selector
      const newRow = tableBody.insertRow();
      const jobID = "P" + jobCounter++;

      newRow.insertCell().textContent = jobID;
      newRow.insertCell().innerHTML = '<input type="number" min="0" required>';
      newRow.insertCell().innerHTML = '<input type="number" min="1" required>';
      newRow.insertCell().innerHTML = '<input type="number" min="0" required>';
    }

    function deleteLast() {
      const tableBody = document.getElementById("process-table").querySelector("tbody");
      if (tableBody.rows.length > 0) {
        tableBody.deleteRow(tableBody.rows.length - 1);
        jobCounter--;
      }
    }

    function getProcesses() {
      const tableBody = document.getElementById("process-table").querySelector("tbody");
      const processes = [];
      for (let i = 0; i < tableBody.rows.length; i++) {
        const row = tableBody.rows[i];
        const job = row.cells[0].textContent;
        const arrival = Number(row.cells[1].children[0].value);
        const burst = Number(row.cells[2].children[0].value);
        const priority = Number(row.cells[3].children[0].value);

        if (isNaN(arrival) || isNaN(burst) || isNaN(priority) || burst <= 0 || arrival < 0) {
          alert(`Invalid input for process ${job}. Burst time must be positive, and arrival time must be non-negative.`);
          return null;
        }
        processes.push({ job, arrival, burst, priority });
      }
      return processes;
    }

    function runScheduling() {
      const processes = getProcesses();
      if (!processes) return;

      const algo = document.getElementById("algorithm").value;
      let results;

      switch (algo) {
        case "fcfs":
          results = fcfs(processes);
          break;
        case "sjf":
          results = sjf(processes);
          break;
        case "priority-non":
          results = priorityNonPreemptive(processes);
          break;
        case "priority-pre":
          results = priorityPreemptive(processes);
          break;
        default:
          alert("Algorithm not implemented");
          return;
      }

      displayResults(results);
    }

    function exitApp() {
      alert("Thank you! Exiting the application.");
      window.close();
    }

    function fcfs(processes) {
    // Sort by arrival time
    processes.sort((a, b) => a.arrival - b.arrival);
    let currentTime = 0;
    const timeline = [];
    let totalBurst = 0;
    processes.forEach(p => totalBurst += p.burst);
    const completionTimes = [];

    for (const p of processes) {
        // If the CPU is idle before this process arrives, add an idle segment
        if (currentTime < p.arrival) {
            timeline.push({ job: "Idle", start: currentTime, end: p.arrival });
            currentTime = p.arrival;
        }
        p.start = currentTime;
        p.finish = currentTime + p.burst;
        p.turnaround = p.finish - p.arrival;
        p.waiting = p.turnaround - p.burst;
        timeline.push({ job: p.job, start: p.start, end: p.finish });
        completionTimes.push(p.finish);
        currentTime = p.finish;
    }
    return { timeline, processes, totalBurst, totalTime: currentTime, completionTimes };
}

function sjf(processes) {
  let currentTime = 0;
  const timeline = [];
  let totalBurst = 0;
  processes.forEach(p => totalBurst += p.burst);
  const completionTimes = [];
  const n = processes.length;
  const done = Array(n).fill(false);
  let completed = 0;

  while (completed < n) {
    // Find all processes that have arrived and are not done
    let idx = -1;
    let minBurst = Infinity;
    for (let i = 0; i < n; i++) {
      if (!done[i] && processes[i].arrival <= currentTime && processes[i].burst < minBurst) {
        minBurst = processes[i].burst;
        idx = i;
      }
    }
    if (idx === -1) {
      // No process has arrived yet, jump to the next arrival and add idle
      let nextArrival = Math.min(...processes.filter((p, i) => !done[i]).map(p => p.arrival));
      timeline.push({ job: "Idle", start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }
    processes[idx].start = currentTime;
    processes[idx].finish = currentTime + processes[idx].burst;
    processes[idx].turnaround = processes[idx].finish - processes[idx].arrival;
    processes[idx].waiting = processes[idx].turnaround - processes[idx].burst;
    timeline.push({ job: processes[idx].job, start: processes[idx].start, end: processes[idx].finish });
    completionTimes.push(processes[idx].finish);
    currentTime = processes[idx].finish;
    done[idx] = true;
    completed++;
  }
  return { timeline, processes, totalBurst, totalTime: currentTime, completionTimes };
}

    function priorityPreemptive(processes) {
    // Sort by arrival time for tie-breaking
    processes.sort((a, b) => a.arrival - b.arrival);
    let currentTime = 0;
    const timeline = [];
    let totalBurst = 0;
    processes.forEach(p => totalBurst += p.burst);
    const completionTimes = [];
    const remainingBurst = processes.map(p => p.burst);
    const completed = Array(processes.length).fill(false);
    const n = processes.length;
    let lastJob = null;

    // Track the last time each process was running
    let finishTimes = Array(n).fill(0);

    while (completed.includes(false)) {
        let nextProcess = null;
        let minPriority = Infinity;

        // Find the process with the highest priority that has arrived and is not completed
        for (let i = 0; i < n; i++) {
            if (!completed[i] && processes[i].arrival <= currentTime && remainingBurst[i] > 0) {
                if (processes[i].priority < minPriority) {
                    minPriority = processes[i].priority;
                    nextProcess = i;
                }
            }
        }

        if (nextProcess === null) {
            // Find the next earliest arrival
            let nextArrival = Math.min(...processes.filter((p, i) => !completed[i]).map(p => p.arrival));
            if (currentTime < nextArrival) {
                // Add idle segment
                timeline.push({ job: "Idle", start: currentTime, end: nextArrival });
                currentTime = nextArrival;
            } else {
                currentTime++;
            }
            lastJob = null;
            continue;
        }

       // Always close the previous segment and start a new one for every time unit
if (timeline.length === 0 || timeline[timeline.length - 1].job !== processes[nextProcess].job) {
    // Close previous segment
    if (timeline.length > 0 && timeline[timeline.length - 1].end === null) {
        timeline[timeline.length - 1].end = currentTime;
    }
    // Start new segment
    timeline.push({ job: processes[nextProcess].job, start: currentTime, end: null });
}

        remainingBurst[nextProcess]--;
        currentTime++;

        // If process finished
        if (remainingBurst[nextProcess] === 0) {
            processes[nextProcess].finish = currentTime;
            processes[nextProcess].turnaround = processes[nextProcess].finish - processes[nextProcess].arrival;
            processes[nextProcess].waiting = processes[nextProcess].turnaround - processes[nextProcess].burst;
            timeline[timeline.length - 1].end = currentTime;
            completionTimes.push(currentTime);
            completed[nextProcess] = true;
        }
    }
    // Close any open timeline segment
    if (timeline.length > 0 && timeline[timeline.length - 1].end === null) {
        timeline[timeline.length - 1].end = currentTime;
    }
    return { timeline, processes, totalBurst, totalTime: currentTime, completionTimes };
}

    function priorityNonPreemptive(processes) {
  let currentTime = 0;
  const timeline = [];
  let totalBurst = 0;
  processes.forEach(p => totalBurst += p.burst);
  const completionTimes = [];
  const n = processes.length;
  const done = Array(n).fill(false);
  let completed = 0;

  while (completed < n) {
    // Find all processes that have arrived and are not done, pick the one with highest priority (lowest number)
    let idx = -1;
    let minPriority = Infinity;
    for (let i = 0; i < n; i++) {
      if (!done[i] && processes[i].arrival <= currentTime && processes[i].priority < minPriority) {
        minPriority = processes[i].priority;
        idx = i;
      }
    }
    if (idx === -1) {
      // No process has arrived yet, jump to the next arrival and add idle
      let nextArrival = Math.min(...processes.filter((p, i) => !done[i]).map(p => p.arrival));
      timeline.push({ job: "Idle", start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }
    processes[idx].start = currentTime;
    processes[idx].finish = currentTime + processes[idx].burst;
    processes[idx].turnaround = processes[idx].finish - processes[idx].arrival;
    processes[idx].waiting = processes[idx].turnaround - processes[idx].burst;
    timeline.push({ job: processes[idx].job, start: processes[idx].start, end: processes[idx].finish });
    completionTimes.push(processes[idx].finish);
    currentTime = processes[idx].finish;
    done[idx] = true;
    completed++;
  }
  return { timeline, processes, totalBurst, totalTime: currentTime, completionTimes };
}

  // (removed duplicate displayResults function)

  const colorMap = {};
  function getColor(job) {
    if (colorMap[job]) return colorMap[job];
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    colorMap[job] = color;
    return color;
  }

    // Overwrite displayResults to make Gantt chart text-based
    function displayResults(results) {
        const { timeline, processes, totalBurst, totalTime, completionTimes } = results;

        const ganttChart = document.getElementById("gantt-chart");
        ganttChart.innerHTML = "";

        // Prevent errors if there are no jobs/timeline
        if (!timeline || timeline.length === 0) {
            ganttChart.innerHTML = "<em>No jobs to display.</em>";
            return;
        }

        let ganttText = "";
        // Calculate the width for each segment (max job name length + padding)
        const segmentWidth = Math.max(...timeline.map(seg => seg.job.length), 2) + 4; // 4 for padding and bars

        // Helper to pad strings
        function padCenter(str, width) {
            const len = str.length;
            if (len >= width) return str;
            const left = Math.floor((width - len) / 2);
            const right = width - len - left;
            return " ".repeat(left) + str + " ".repeat(right);
        }

        // Build Gantt chart text and timeline, including Idle Time
        let timePoints = [];
        let lastEnd = null;
        timeline.forEach((segment, idx) => {
            // Insert Idle if there's a gap
            if (lastEnd !== null && segment.start > lastEnd) {
                // Draw Idle bar
                ganttText += "|" + padCenter("Idle", segmentWidth);
                // Push the start of idle (which is lastEnd)
                timePoints.push(lastEnd);
                // Push the end of idle (which is segment.start)
                timePoints.push(segment.start);
            }
            // For the very first segment, always push its start time
            if (lastEnd === null) {
                timePoints.push(segment.start);
            }
            ganttText += "|" + padCenter(segment.job, segmentWidth);
            timePoints.push(segment.end);
            lastEnd = segment.end;
        });
        ganttText += "|";

        // Build aligned timeline: align time under each '|'
        let timeLineText = "";
        let pos = 0;
        for (let i = 0; i < timePoints.length; i++) {
            const tStr = timePoints[i].toString();
            let barPos = i * (segmentWidth + 1);
            let spacesNeeded = barPos - pos - tStr.length + 1; // +1 to align under '|'
            if (spacesNeeded < 0) spacesNeeded = 0;
            timeLineText += " ".repeat(spacesNeeded) + tStr;
            pos = barPos + tStr.length;
        }

        ganttChart.innerHTML = `<pre style="font-size:18px;font-family:monospace">${ganttText}\n${timeLineText}</pre>`;

        // Timeline (show job numbers)
        const timelineDiv = document.getElementById("timeline");
        timelineDiv.innerHTML = "";
        processes.forEach((p, idx) => {
            const jobMark = document.createElement("span");
            jobMark.style.marginRight = "20px";
            jobMark.textContent = `${p.job} : ${p.arrival}`;
            timelineDiv.appendChild(jobMark);
        });

        // Turnaround and Waiting Time
        const tatDiv = document.getElementById("tat-results");
        const wtDiv = document.getElementById("wt-results");
        tatDiv.innerHTML = "";
        wtDiv.innerHTML = "";
        let totalTurnaround = 0;
        let totalWaiting = 0;

        // Sort processes by job name (P1, P2, ...)
        const sortedProcesses = [...processes].sort((a, b) => {
            const numA = parseInt(a.job.replace(/\D/g, ""), 10);
            const numB = parseInt(b.job.replace(/\D/g, ""), 10);
            return numA - numB;
        });

        sortedProcesses.forEach(function(p) {
            totalTurnaround += p.turnaround;
            totalWaiting += p.waiting;

            const pTat = document.createElement("p");
            pTat.textContent = `${p.job}: ${p.finish} - ${p.arrival} = ${p.turnaround}`;
            tatDiv.appendChild(pTat);

             const pWt = document.createElement("p");
            pWt.textContent = `${p.job}: ${p.turnaround} - ${p.burst} = ${p.waiting}`;
            wtDiv.appendChild(pWt);
        });

        // Center the Gantt chart output text
        ganttChart.style.textAlign = "center";
        const avgTat = (totalTurnaround / processes.length).toFixed(2);
        const avgWt = (totalWaiting / processes.length).toFixed(2);
        // Show average turnaround time
        const avgTatP = document.createElement("p");
        avgTatP.textContent = `Average Turnaround Time: ${avgTat} m.s`;
        tatDiv.appendChild(avgTatP);

        // Show average waiting time
        const avgWtP = document.createElement("p");
        avgWtP.textContent = `Average Waiting Time: ${avgWt} m.s`;
        wtDiv.appendChild(avgWtP);

        document.getElementById("cpu-used").textContent = totalBurst;
        document.getElementById("total-time").textContent = totalTime;
        const cpuPercent = totalTime === 0 ? 0 : ((totalBurst / totalTime) * 100).toFixed(2);
        document.getElementById("cpu-percent").textContent = cpuPercent;

        // Center the text in the Gantt chart
        ganttChart.style.display = "flex";
        ganttChart.style.justifyContent = "center";
        ganttChart.style.alignItems = "center";
        ganttChart.style.flexDirection = "column";

        // Visual Gantt Chart rendering NEW
const chartWidth = ganttChart.offsetWidth || 800; // fallback width
const totalDuration = timeline[timeline.length - 1].end - timeline[0].start;
const minBlockWidth = 40; // minimum width for visibility

// Container for blocks
const blocksContainer = document.createElement("div");
blocksContainer.style.display = "flex";
blocksContainer.style.alignItems = "center";
blocksContainer.style.height = "100%";
blocksContainer.style.width = "100%";

// Render each segment as a colored block
timeline.forEach(segment => {
    const duration = segment.end - segment.start;
    let width = Math.max((duration / totalDuration) * chartWidth, minBlockWidth);
    const block = document.createElement("div");
    block.style.width = width + "px";
    block.style.height = "40px";
    block.style.display = "flex";
    block.style.flexDirection = "column";
    block.style.alignItems = "center";
    block.style.justifyContent = "center";
    block.style.marginRight = "2px";
    block.style.background = segment.job === "Idle" ? "#c4d9ff" : "#d0a2f7"; // light blue for idle, light purple for jobs
    block.style.color = "#3b0764";
    block.style.fontWeight = "bold";
    block.style.fontFamily = "monospace";
    block.innerHTML = `
        <span style="font-size:15px;">${segment.job}</span>
        <span style="font-size:12px;font-weight:normal;">${segment.end}</span>
    `;
    blocksContainer.appendChild(block);
});

ganttChart.innerHTML = ""; // Clear previous chart
ganttChart.appendChild(blocksContainer);
    }