// analysis_sources.js
document.addEventListener('DOMContentLoaded', function() {
    loadSourcesAnalysis();
    
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('exportSources').addEventListener('click', exportSources);
});

function loadSourcesAnalysis() {
    fetch('/api/sources/analysis')
        .then(response => response.json())
        .then(data => {
            initializeCharts(data);
            updateSourcesTable(data);
            updateSourcesStats(data);
        })
        .catch(error => {
            console.error('Error loading sources analysis:', error);
            showNotification('Error loading sources data', 'error');
        });
}

function initializeCharts(sourcesData) {
    // Sources Distribution Chart
    const sourcesCtx = document.getElementById('sourcesChart').getContext('2d');
    new Chart(sourcesCtx, {
        type: 'doughnut',
        data: {
            labels: ['Social Media', 'News Sites', 'Blogs'],
            datasets: [{
                data: [
                    sourcesData.social_media.total_claims,
                    sourcesData.news_sites.total_claims,
                    sourcesData.blogs.total_claims
                ],
                backgroundColor: [
                    'rgba(230, 57, 70, 0.8)',
                    'rgba(76, 201, 240, 0.8)',
                    'rgba(247, 37, 133, 0.8)'
                ],
                borderColor: [
                    'rgba(230, 57, 70, 1)',
                    'rgba(76, 201, 240, 1)',
                    'rgba(247, 37, 133, 1)'
                ],
                borderWidth: 2
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
                    text: 'Claims Distribution by Source Type'
                }
            }
        }
    });

    // Platforms Chart
    const platformsCtx = document.getElementById('platformsChart').getContext('2d');
    const platforms = sourcesData.social_media.platforms;
    
    new Chart(platformsCtx, {
        type: 'bar',
        data: {
            labels: platforms.map(p => p.name),
            datasets: [{
                label: 'False Claims Rate (%)',
                data: platforms.map(p => p.false_rate),
                backgroundColor: 'rgba(230, 57, 70, 0.6)',
                borderColor: 'rgba(230, 57, 70, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'False Claims Rate (%)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'False Claims Rate by Social Media Platform'
                }
            }
        }
    });
}

function updateSourcesTable(sourcesData) {
    const tableBody = document.getElementById('sourcesTable');
    
    const sources = [
        {
            type: 'Social Media',
            total: sourcesData.social_media.total_claims,
            false: sourcesData.social_media.false_claims,
            verified: sourcesData.social_media.verified_claims,
            falseRate: Math.round((sourcesData.social_media.false_claims / sourcesData.social_media.total_claims) * 100),
            avgConfidence: 72,
            trend: '+5.2%'
        },
        {
            type: 'News Sites',
            total: sourcesData.news_sites.total_claims,
            false: sourcesData.news_sites.false_claims,
            verified: sourcesData.news_sites.verified_claims,
            falseRate: Math.round((sourcesData.news_sites.false_claims / sourcesData.news_sites.total_claims) * 100),
            avgConfidence: 88,
            trend: '-2.1%'
        },
        {
            type: 'Blogs',
            total: sourcesData.blogs.total_claims,
            false: sourcesData.blogs.false_claims,
            verified: sourcesData.blogs.verified_claims,
            falseRate: Math.round((sourcesData.blogs.false_claims / sourcesData.blogs.total_claims) * 100),
            avgConfidence: 65,
            trend: '+3.8%'
        }
    ];

    tableBody.innerHTML = '';
    
    sources.forEach(source => {
        const row = document.createElement('tr');
        const trendClass = source.trend.startsWith('+') ? 'trend-up' : 'trend-down';
        
        row.innerHTML = `
            <td><strong>${source.type}</strong></td>
            <td>${source.total.toLocaleString()}</td>
            <td>${source.false.toLocaleString()}</td>
            <td>${source.verified.toLocaleString()}</td>
            <td>
                <div class="false-rate">
                    <div class="rate-bar">
                        <div class="rate-fill" style="width: ${source.falseRate}%"></div>
                    </div>
                    <span>${source.falseRate}%</span>
                </div>
            </td>
            <td>${source.avgConfidence}%</td>
            <td class="${trendClass}">${source.trend}</td>
        `;
        tableBody.appendChild(row);
    });
}

function updateSourcesStats(sourcesData) {
    const statsContainer = document.getElementById('sourcesStats');
    
    const totalClaims = sourcesData.social_media.total_claims + 
                       sourcesData.news_sites.total_claims + 
                       sourcesData.blogs.total_claims;
    
    const totalFalse = sourcesData.social_media.false_claims + 
                      sourcesData.news_sites.false_claims + 
                      sourcesData.blogs.false_claims;
    
    const overallFalseRate = Math.round((totalFalse / totalClaims) * 100);
    
    statsContainer.innerHTML = `
        <div class="stats-grid-detailed">
            <div class="stat-card detailed">
                <div class="stat-icon icon-false">
                    <i class="fas fa-chart-pie"></i>
                </div>
                <div class="stat-info">
                    <h3>${totalClaims.toLocaleString()}</h3>
                    <p>Total Claims Analyzed</p>
                </div>
            </div>
            <div class="stat-card detailed">
                <div class="stat-icon icon-verified">
                    <i class="fas fa-percentage"></i>
                </div>
                <div class="stat-info">
                    <h3>${overallFalseRate}%</h3>
                    <p>Overall False Rate</p>
                </div>
            </div>
            <div class="stat-card detailed">
                <div class="stat-icon icon-trends">
                    <i class="fas fa-share-alt"></i>
                </div>
                <div class="stat-info">
                    <h3>${sourcesData.social_media.platforms.length}</h3>
                    <p>Platforms Monitored</p>
                </div>
            </div>
        </div>
    `;
}

function applyFilters() {
    // In a real implementation, this would refetch data with filters
    showNotification('Sources filters applied');
}

function exportSources() {
    fetch('/api/sources/analysis')
        .then(response => response.json())
        .then(data => {
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `sources-analysis-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            showNotification('Sources analysis exported successfully!');
        })
        .catch(error => {
            console.error('Error exporting sources analysis:', error);
            showNotification('Error exporting sources analysis', 'error');
        });
}

function showNotification(message, type = 'success') {
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
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}