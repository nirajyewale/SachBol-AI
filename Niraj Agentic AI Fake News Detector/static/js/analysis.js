// analysis.js - UPDATED with proper filtering
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Charts
    let trendsChart, sourcesChart;
    
    function initializeCharts() {
        const trendsCtx = document.getElementById('trendsChart').getContext('2d');
        trendsChart = new Chart(trendsCtx, {
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
        
        // Sources Chart
        const sourcesCtx = document.getElementById('sourcesChart').getContext('2d');
        sourcesChart = new Chart(sourcesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Social Media', 'News Sites', 'Blogs', 'Forums', 'Other'],
                datasets: [{
                    data: [35, 25, 15, 15, 10],
                    backgroundColor: [
                        'rgba(230, 57, 70, 0.7)',
                        'rgba(76, 201, 240, 0.7)',
                        'rgba(247, 37, 133, 0.7)',
                        'rgba(67, 97, 238, 0.7)',
                        'rgba(29, 53, 87, 0.7)'
                    ],
                    borderColor: [
                        'rgba(230, 57, 70, 1)',
                        'rgba(76, 201, 240, 1)',
                        'rgba(247, 37, 133, 1)',
                        'rgba(67, 97, 238, 1)',
                        'rgba(29, 53, 87, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: 'Claims by Source Type'
                    }
                }
            }
        });
    }
    
    initializeCharts();
    
    // Load initial data
    loadClaimsData();
    loadInsights();
    
    // Set up event listeners
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('exportData').addEventListener('click', exportData);
    
    // Set up periodic updates
    setInterval(loadClaimsData, 15000);
    setInterval(loadInsights, 20000);
});

function getCurrentFilters() {
    return {
        timePeriod: document.getElementById('time-period').value,
        category: document.getElementById('category').value,
        status: document.getElementById('status').value
    };
}

function loadClaimsData() {
    const filters = getCurrentFilters();
    
    // Build query string with filters
    const queryParams = new URLSearchParams({
        category: filters.category,
        status: filters.status,
        time_period: filters.timePeriod
    });
    
    fetch(`/api/claims?${queryParams}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const claimsTable = document.getElementById('claimsTable');
            claimsTable.innerHTML = '';
            
            if (data.claims && data.claims.length > 0) {
                data.claims.forEach(claim => {
                    const row = document.createElement('tr');
                    
                    const statusClass = claim.status === 'false' ? 'status-false' : 
                                      claim.status === 'verified' ? 'status-verified' : 'status-pending';
                    const statusText = claim.status === 'false' ? 'False' : 
                                     claim.status === 'verified' ? 'Verified' : 'Pending';
                    
                    row.innerHTML = `
                        <td>${claim.text}</td>
                        <td>${claim.category}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>${claim.date}</td>
                        <td>${claim.confidence}%</td>
                    `;
                    
                    claimsTable.appendChild(row);
                });
                
                // Update table message
                const filterMessage = generateFilterMessage(filters);
                if (filterMessage) {
                    const messageRow = document.createElement('tr');
                    messageRow.innerHTML = `
                        <td colspan="5" style="text-align: center; padding: 0.5rem; font-size: 0.9rem; color: var(--gray);">
                            ${filterMessage}
                        </td>
                    `;
                    claimsTable.appendChild(messageRow);
                }
            } else {
                claimsTable.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 2rem;">
                            No claims found matching the current filters.
                        </td>
                    </tr>
                `;
            }
        })
        .catch(error => {
            console.error('Error fetching claims data:', error);
            const claimsTable = document.getElementById('claimsTable');
            claimsTable.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem; color: var(--danger);">
                        Error loading claims data. Please try again later.
                    </td>
                </tr>
            `;
        });
}

function loadInsights() {
    const filters = getCurrentFilters();
    
    // Build query string with time period filter
    const queryParams = new URLSearchParams({
        time_period: filters.timePeriod
    });
    
    fetch(`/api/insights?${queryParams}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const insightsList = document.getElementById('insightsList');
            insightsList.innerHTML = '';
            
            if (data.insights && data.insights.length > 0) {
                data.insights.forEach(insight => {
                    const listItem = document.createElement('li');
                    listItem.className = 'insight-item';
                    
                    listItem.innerHTML = `
                        <div class="insight-header">
                            <div class="insight-title">${insight.title}</div>
                            <div class="insight-time">${insight.time}</div>
                        </div>
                        <div class="insight-content">${insight.content}</div>
                        <div class="insight-metrics">
                            <span><i class="fas fa-chart-line"></i> ${insight.trend}% trend</span>
                            <span><i class="fas fa-exclamation-triangle"></i> ${insight.impact} impact</span>
                        </div>
                    `;
                    
                    insightsList.appendChild(listItem);
                });
            } else {
                insightsList.innerHTML = `
                    <li class="insight-item">
                        <div class="insight-header">
                            <div class="insight-title">No Insights Available</div>
                        </div>
                        <div class="insight-content">No insights match the current filter criteria.</div>
                    </li>
                `;
            }
        })
        .catch(error => {
            console.error('Error fetching insights:', error);
            const insightsList = document.getElementById('insightsList');
            insightsList.innerHTML = `
                <li class="insight-item">
                    <div class="insight-header">
                        <div class="insight-title">Temporarily Unavailable</div>
                    </div>
                    <div class="insight-content">Insights data is currently unavailable.</div>
                </li>
            `;
        });
}

function applyFilters() {
    const filters = getCurrentFilters();
    
    console.log('Applying filters:', filters);
    
    // Reload data with filters
    loadClaimsData();
    loadInsights();
    
    // Show notification with actual filter values
    const filterMessage = generateFilterMessage(filters);
    showNotification(`Filters applied: ${filterMessage}`);
}

function exportData() {
    const filters = getCurrentFilters();
    
    // Build query string with filters
    const queryParams = new URLSearchParams({
        category: filters.category,
        status: filters.status,
        time_period: filters.timePeriod
    });
    
    fetch(`/api/export?${queryParams}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Create and download a JSON file
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `truthguard-export-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            showNotification('Data exported successfully!');
        })
        .catch(error => {
            console.error('Error exporting data:', error);
            showNotification('Error exporting data. Please try again.', 'error');
        });
}

function generateFilterMessage(filters) {
    const messages = [];
    
    if (filters.category !== 'all') {
        messages.push(`Category: ${filters.category}`);
    }
    
    if (filters.status !== 'all') {
        messages.push(`Status: ${filters.status}`);
    }
    
    if (filters.timePeriod !== 'all') {
        const timeLabels = {
            '7d': 'Last 7 days',
            '30d': 'Last 30 days', 
            '90d': 'Last 90 days',
            '1y': 'Last year'
        };
        messages.push(`Time: ${timeLabels[filters.timePeriod] || filters.timePeriod}`);
    }
    
    return messages.length > 0 ? `Showing ${messages.join(', ')}` : '';
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'error' ? 'var(--danger)' : 'var(--success)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}