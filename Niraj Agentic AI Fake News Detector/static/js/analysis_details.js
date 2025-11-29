// analysis_details.js
document.addEventListener('DOMContentLoaded', function() {
    initializeDetailedCharts();
    loadDetailedClaims();
    
    // Event listeners
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('exportData').addEventListener('click', exportDetailedReport);
    document.getElementById('toggleChartView').addEventListener('click', toggleChartView);
    document.getElementById('toggleColumns').addEventListener('click', toggleColumns);
});

function initializeDetailedCharts() {
    const trendsCtx = document.getElementById('detailedTrendsChart').getContext('2d');
    new Chart(trendsCtx, {
        type: 'bar',
        data: {
            labels: ['Health', 'Politics', 'Technology', 'Finance', 'Entertainment', 'Science'],
            datasets: [{
                label: 'False Claims',
                data: [45, 32, 28, 22, 18, 15],
                backgroundColor: 'rgba(230, 57, 70, 0.8)',
                borderColor: 'rgba(230, 57, 70, 1)',
                borderWidth: 1
            }, {
                label: 'Verified Claims',
                data: [25, 18, 22, 28, 12, 20],
                backgroundColor: 'rgba(76, 201, 240, 0.8)',
                borderColor: 'rgba(76, 201, 240, 1)',
                borderWidth: 1
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
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Claims Distribution by Category'
                }
            }
        }
    });
}

function loadDetailedClaims() {
    const filters = getCurrentFilters();
    const queryParams = new URLSearchParams(filters);
    
    fetch(`/api/claims/detailed?${queryParams}`)
        .then(response => response.json())
        .then(data => {
            updateDetailedClaimsTable(data.claims);
            updateSummaryStats(data.claims);
        })
        .catch(error => {
            console.error('Error loading detailed claims:', error);
            showNotification('Error loading detailed data', 'error');
        });
}

function updateDetailedClaimsTable(claims) {
    const tableBody = document.getElementById('detailedClaimsTable');
    tableBody.innerHTML = '';
    
    if (claims.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem;">
                    No claims found matching the current filters.
                </td>
            </tr>
        `;
        return;
    }
    
    claims.forEach(claim => {
        const row = document.createElement('tr');
        const statusClass = claim.status === 'false' ? 'status-false' : 
                          claim.status === 'verified' ? 'status-verified' : 'status-pending';
        const statusText = claim.status === 'false' ? 'False' : 
                         claim.status === 'verified' ? 'Verified' : 'Pending';
        
        row.innerHTML = `
            <td>${claim.text}</td>
            <td>${claim.category}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${claim.source}</td>
            <td>${claim.reach_estimate.toLocaleString()}</td>
            <td>${claim.verification_time}</td>
            <td>
                <div class="impact-score">
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${claim.impact_score}%"></div>
                    </div>
                    <span>${claim.impact_score}</span>
                </div>
            </td>
            <td>
                <button class="btn-action btn-view" onclick="viewClaimDetails(${claim.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action btn-analyze" onclick="analyzeClaim(${claim.id})">
                    <i class="fas fa-chart-bar"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateSummaryStats(claims) {
    if (claims.length === 0) return;
    
    const falseClaims = claims.filter(c => c.status === 'false').length;
    const falseRate = Math.round((falseClaims / claims.length) * 100);
    document.getElementById('falseClaimsRate').textContent = `${falseRate}%`;
    
    // Simulate other stats
    document.getElementById('avgVerificationTime').textContent = '42m';
    document.getElementById('totalReach').textContent = '2.1M';
}

function applyFilters() {
    loadDetailedClaims();
    showNotification('Filters applied to detailed view');
}

function exportDetailedReport() {
    const filters = getCurrentFilters();
    const queryParams = new URLSearchParams(filters);
    
    fetch(`/api/export?${queryParams}&report_type=detailed`)
        .then(response => response.json())
        .then(data => {
            // Create and download report
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `detailed-analysis-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            showNotification('Detailed report exported successfully!');
        })
        .catch(error => {
            console.error('Error exporting report:', error);
            showNotification('Error exporting report', 'error');
        });
}

function toggleChartView() {
    showNotification('Chart view toggled - this would switch between different chart types');
}

function toggleColumns() {
    showNotification('Column customization would open here');
}

function viewClaimDetails(claimId) {
    // In a real implementation, this would open a modal or navigate to claim details
    showNotification(`Viewing details for claim #${claimId}`);
}

function analyzeClaim(claimId) {
    // In a real implementation, this would perform additional analysis
    showNotification(`Analyzing claim #${claimId}`);
}

function getCurrentFilters() {
    return {
        timePeriod: document.getElementById('time-period').value,
        category: document.getElementById('category').value,
        status: document.getElementById('status').value
    };
}

function showNotification(message, type = 'success') {
    // Reuse the notification function from analysis.js or implement here
    console.log(`${type}: ${message}`);
    alert(message); // Simple alert for demo
}