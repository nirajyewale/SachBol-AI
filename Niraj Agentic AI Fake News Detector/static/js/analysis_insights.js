// analysis_insights.js
document.addEventListener('DOMContentLoaded', function() {
    loadAllInsights();
    
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('exportInsights').addEventListener('click', exportInsights);
    document.getElementById('toggleInsightView').addEventListener('click', toggleInsightView);
});

function loadAllInsights() {
    fetch('/api/insights/all?time_period=all')
        .then(response => response.json())
        .then(data => {
            displayInsights(data.insights);
        })
        .catch(error => {
            console.error('Error loading insights:', error);
            showNotification('Error loading insights', 'error');
        });
}

function displayInsights(insights) {
    const insightsGrid = document.getElementById('insightsGrid');
    const totalInsights = document.getElementById('totalInsights');
    
    totalInsights.textContent = insights.length;
    
    if (insights.length === 0) {
        insightsGrid.innerHTML = `
            <div class="no-insights">
                <i class="fas fa-lightbulb" style="font-size: 3rem; color: var(--gray); margin-bottom: 1rem;"></i>
                <h3>No Insights Available</h3>
                <p>No insights match the current filter criteria.</p>
            </div>
        `;
        return;
    }

    insightsGrid.innerHTML = '';
    
    insights.forEach(insight => {
        const insightCard = document.createElement('div');
        insightCard.className = 'insight-card';
        
        const impactClass = getImpactClass(insight.impact);
        const trendIcon = insight.trend > 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        const trendClass = insight.trend > 0 ? 'trend-up' : 'trend-down';
        
        insightCard.innerHTML = `
            <div class="insight-header">
                <div class="insight-category">${insight.category}</div>
                <div class="insight-impact ${impactClass}">${insight.impact}</div>
            </div>
            <h4 class="insight-title">${insight.title}</h4>
            <p class="insight-content">${insight.content}</p>
            <div class="insight-meta">
                <span class="insight-time"><i class="fas fa-clock"></i> ${insight.time}</span>
                <span class="insight-confidence"><i class="fas fa-chart-line"></i> ${insight.confidence}% confidence</span>
            </div>
            <div class="insight-trend ${trendClass}">
                <i class="fas ${trendIcon}"></i> ${Math.abs(insight.trend)}% trend
            </div>
            <div class="insight-actions">
                <button class="btn-action btn-view" onclick="viewInsightDetails(${insight.id})">
                    <i class="fas fa-eye"></i> Details
                </button>
                <button class="btn-action btn-analyze" onclick="analyzeInsight(${insight.id})">
                    <i class="fas fa-chart-bar"></i> Analyze
                </button>
            </div>
        `;
        
        insightsGrid.appendChild(insightCard);
    });
}

function applyFilters() {
    const timePeriod = document.getElementById('time-period').value;
    const category = document.getElementById('category').value;
    const impact = document.getElementById('impact').value;
    
    fetch(`/api/insights/all?time_period=${timePeriod}`)
        .then(response => response.json())
        .then(data => {
            let filteredInsights = data.insights;
            
            // Apply category filter
            if (category !== 'all') {
                filteredInsights = filteredInsights.filter(insight => 
                    insight.category.toLowerCase() === category.toLowerCase()
                );
            }
            
            // Apply impact filter
            if (impact !== 'all') {
                filteredInsights = filteredInsights.filter(insight => 
                    insight.impact.toLowerCase() === impact.toLowerCase()
                );
            }
            
            displayInsights(filteredInsights);
            showNotification(`Applied filters: ${filteredInsights.length} insights found`);
        })
        .catch(error => {
            console.error('Error filtering insights:', error);
            showNotification('Error applying filters', 'error');
        });
}

function exportInsights() {
    fetch('/api/insights/all?time_period=all')
        .then(response => response.json())
        .then(data => {
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `insights-export-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            showNotification('Insights exported successfully!');
        })
        .catch(error => {
            console.error('Error exporting insights:', error);
            showNotification('Error exporting insights', 'error');
        });
}

function toggleInsightView() {
    const grid = document.getElementById('insightsGrid');
    const button = document.getElementById('toggleInsightView');
    
    if (grid.classList.contains('list-view')) {
        grid.classList.remove('list-view');
        grid.classList.add('grid-view');
        button.innerHTML = '<i class="fas fa-grip-horizontal"></i> Grid View';
    } else {
        grid.classList.remove('grid-view');
        grid.classList.add('list-view');
        button.innerHTML = '<i class="fas fa-list"></i> List View';
    }
}

function getImpactClass(impact) {
    switch (impact.toLowerCase()) {
        case 'high': return 'impact-high';
        case 'medium': return 'impact-medium';
        case 'low': return 'impact-low';
        default: return 'impact-medium';
    }
}

function viewInsightDetails(insightId) {
    showNotification(`Viewing insight #${insightId}`);
    // In real implementation, show detailed insight view
}

function analyzeInsight(insightId) {
    showNotification(`Analyzing insight #${insightId}`);
    // In real implementation, perform deep analysis
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