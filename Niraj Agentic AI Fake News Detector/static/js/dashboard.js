// dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Charts
    const trendsCtx = document.getElementById('claimsChart').getContext('2d');
    const trendsChart = new Chart(trendsCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'False Claims',
                data: [65, 59, 80, 81, 56, 55, 70, 75, 60, 55, 50, 45],
                backgroundColor: 'rgba(230, 57, 70, 0.1)',
                borderColor: 'rgba(230, 57, 70, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }, {
                label: 'Verified Claims',
                data: [28, 48, 40, 19, 86, 27, 35, 40, 45, 50, 55, 60],
                backgroundColor: 'rgba(76, 201, 240, 0.1)',
                borderColor: 'rgba(76, 201, 240, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Claims'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Claims Trend Over Time'
                }
            }
        }
    });
    
    // Initialize Socket.IO
    const socket = io();
    
    // Listen for real-time verification updates
    socket.on('new_verification', function(data) {
        console.log('New verification:', data);
        addRealTimeUpdate(data);
    });
    
    // Listen for crisis alerts
    socket.on('crisis_alert', function(data) {
        console.log('Crisis alert:', data);
        showCrisisAlert(data);
    });
    
    // Listen for human review items
    socket.on('human_review', function(data) {
        console.log('Human review needed:', data);
        addHumanReviewItem(data);
    });
    
    function addRealTimeUpdate(verification) {
        const updatesList = document.getElementById('updatesList');
        const statusClass = verification.score < -0.3 ? 'status-false' : 
                           verification.score > 0.3 ? 'status-verified' : 'status-pending';
        const statusText = verification.score < -0.3 ? 'false' : 
                          verification.score > 0.3 ? 'verified' : 'pending';
        
        const newUpdate = document.createElement('li');
        newUpdate.className = 'update-item';
        newUpdate.innerHTML = `
            <div class="update-header">
                <div class="update-title">${verification.claim.substring(0, 50)}...</div>
                <div class="update-time">Just now</div>
            </div>
            <div class="update-content">Claim analyzed: ${verification.severity}</div>
            <span class="update-status ${statusClass}">${statusText}</span>
        `;
        
        updatesList.insertBefore(newUpdate, updatesList.firstChild);
        
        // Keep only the last 10 updates
        if (updatesList.children.length > 10) {
            updatesList.removeChild(updatesList.lastChild);
        }
        
        // Update stats counters
        updateStatsCounter(statusText);
    }
    
    function showCrisisAlert(alert) {
        const crisisPanel = document.getElementById('crisisPanel');
        const crisisClaim = document.getElementById('crisisClaim');
        
        crisisClaim.textContent = alert.claim;
        crisisPanel.style.display = 'block';
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            crisisPanel.style.display = 'none';
        }, 10000);
    }
    
    function updateStatsCounter(status) {
        // Update the appropriate counter
        const counters = {
            'false': 'falseCount',
            'verified': 'verifiedCount',
            'pending': 'pendingCount'
        };
        
        if (counters[status]) {
            const counterElement = document.getElementById(counters[status]);
            if (counterElement) {
                const currentValue = parseInt(counterElement.textContent.replace(/,/g, ''));
                counterElement.textContent = (currentValue + 1).toLocaleString();
            }
        }
    }
    
    // Load initial data
    loadUpdates();
    loadTrends();
    
    // Set up periodic updates
    setInterval(loadUpdates, 15000);
    setInterval(loadTrends, 20000);
});

function loadUpdates() {
    fetch('/api/updates')
        .then(response => response.json())
        .then(data => {
            const updatesList = document.getElementById('updatesList');
            
            if (data.updates && data.updates.length > 0) {
                updatesList.innerHTML = '';
                
                data.updates.forEach(update => {
                    const listItem = document.createElement('li');
                    listItem.className = 'update-item';
                    
                    const statusClass = update.status === 'false' ? 'status-false' : 'status-verified';
                    
                    listItem.innerHTML = `
                        <div class="update-header">
                            <div class="update-title">${update.title}</div>
                            <div class="update-time">${update.time}</div>
                        </div>
                        <div class="update-content">${update.content}</div>
                        <span class="update-status ${statusClass}">${update.status}</span>
                    `;
                    
                    updatesList.appendChild(listItem);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching updates:', error);
        });
}

function loadTrends() {
    fetch('/api/trends')
        .then(response => response.json())
        .then(data => {
            const trendsList = document.getElementById('trendsList');
            
            if (data.trends && data.trends.length > 0) {
                trendsList.innerHTML = '';
                
                data.trends.forEach((trend, index) => {
                    const listItem = document.createElement('li');
                    listItem.className = 'trend-item';
                    
                    const rankClass = index < 3 ? 'top' : '';
                    
                    listItem.innerHTML = `
                        <div class="trend-rank ${rankClass}">${index + 1}</div>
                        <div class="trend-info">
                            <div class="trend-topic">${trend.topic}</div>
                            <div class="trend-metrics">
                                <span><i class="fas fa-comment"></i> ${trend.mentions} mentions</span>
                                <span><i class="fas fa-times-circle"></i> ${trend.falseClaims} false</span>
                            </div>
                        </div>
                    `;
                    
                    trendsList.appendChild(listItem);
                });
                
                // Update trends count
                const trendsCount = document.getElementById('trendsCount');
                if (trendsCount) {
                    trendsCount.textContent = data.trends.length;
                }
            }
        })
        .catch(error => {
            console.error('Error fetching trends:', error);
        });
}