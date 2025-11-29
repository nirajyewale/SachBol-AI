// human_review.js - UPDATED VERSION
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Socket.IO
    const socket = io();
    
    // Listen for human review items
    socket.on('human_review', function(data) {
        console.log('New item for human review:', data);
        addHumanReviewItem(data);
    });
    
    // Load initial data
    loadReviewItems();
    loadHistory();
    loadCrisisStats();
    loadCrisisAlerts();
    
    // Set up pagination
    document.getElementById('prevBtn').addEventListener('click', previousPage);
    document.getElementById('nextBtn').addEventListener('click', nextPage);
    
    // Set up button click handlers
    document.getElementById('viewQueueBtn').addEventListener('click', viewQueue);
    document.getElementById('fullGuideBtn').addEventListener('click', showFullGuide);
    document.getElementById('viewAllHistoryBtn').addEventListener('click', viewAllHistory);
    document.getElementById('viewAllAlertsBtn').addEventListener('click', viewAllAlerts);
    
    // Set up periodic updates
    setInterval(loadReviewItems, 15000);
    setInterval(loadHistory, 20000);
    setInterval(loadCrisisStats, 10000);
});

let currentPage = 1;
const itemsPerPage = 2;

// Button functionality
function viewQueue() {
    // Navigate to the claims analysis page
    window.location.href = '/analysis/claims?filter=pending';
}

function showFullGuide() {
    // Show comprehensive review guidelines
    const guideContent = `
        <div class="full-guide">
            <h3>Complete Review Guidelines</h3>
            <div class="guide-section">
                <h4>1. Source Verification</h4>
                <ul>
                    <li>Always check multiple reliable sources (WHO, CDC, Reuters, AP)</li>
                    <li>Verify against official government and health organization statements</li>
                    <li>Check publication dates and timestamps</li>
                    <li>Look for primary sources rather than secondary reporting</li>
                </ul>
            </div>
            <div class="guide-section">
                <h4>2. Crisis Response Protocol</h4>
                <ul>
                    <li>Prioritize claims related to active crises (health, disasters, conflicts)</li>
                    <li>Coordinate with official crisis response teams</li>
                    <li>Issue corrections within 30 minutes for high-risk misinformation</li>
                    <li>Use pre-approved templates for common crisis misinformation</li>
                </ul>
            </div>
            <div class="guide-section">
                <h4>3. Severity Assessment</h4>
                <ul>
                    <li>HIGH: Claims that could cause immediate harm or panic</li>
                    <li>MEDIUM: Misleading but not immediately dangerous claims</li>
                    <li>LOW: Minor inaccuracies or opinion-based statements</li>
                </ul>
            </div>
        </div>
    `;
    
    // Create modal or show in a new section
    alert('Opening full review guide...');
    // In a real implementation, you'd show this in a modal or new page
    console.log('Full guide content:', guideContent);
}

function viewAllHistory() {
    // Show all review history
    alert('Loading complete review history...');
    // This would typically navigate to a dedicated history page
    // or expand the current history section
    const historySection = document.querySelector('.history-container');
    historySection.style.maxHeight = 'none';
}

function viewAllAlerts() {
    // Show all crisis alerts
    alert('Loading all crisis alerts...');
    // This would typically navigate to a crisis dashboard
    window.location.href = '/dashboard#crisis';
}

// Load crisis statistics
function loadCrisisStats() {
    fetch('/api/crisis-stats')
        .then(response => response.json())
        .then(data => {
            const crisisStats = document.getElementById('crisisStats');
            crisisStats.innerHTML = `
                <div class="crisis-stat">
                    <h4>${data.active_crises}</h4>
                    <p>Active Crises</p>
                </div>
                <div class="crisis-stat">
                    <h4>${data.crisis_claims_today}</h4>
                    <p>Crisis Claims Today</p>
                </div>
                <div class="crisis-stat">
                    <h4>${data.high_risk_alerts}</h4>
                    <p>High Risk Alerts</p>
                </div>
                <div class="crisis-stat">
                    <h4>${data.response_time_minutes}m</h4>
                    <p>Avg Response Time</p>
                </div>
            `;
        })
        .catch(error => {
            console.error('Error loading crisis stats:', error);
            // Fallback stats
            const crisisStats = document.getElementById('crisisStats');
            crisisStats.innerHTML = `
                <div class="crisis-stat">
                    <h4>3</h4>
                    <p>Active Crises</p>
                </div>
                <div class="crisis-stat">
                    <h4>47</h4>
                    <p>Crisis Claims Today</p>
                </div>
                <div class="crisis-stat">
                    <h4>8</h4>
                    <p>High Risk Alerts</p>
                </div>
                <div class="crisis-stat">
                    <h4>28m</h4>
                    <p>Avg Response Time</p>
                </div>
            `;
        });
}

// Enhanced addHumanReviewItem with crisis detection
function addHumanReviewItem(reviewItem) {
    const reviewItems = document.getElementById('reviewItems');
    
    // Check if this is a crisis-related claim
    const isCrisis = reviewItem.crisis_context && reviewItem.crisis_context.is_crisis_related;
    const crisisBadge = isCrisis ? `
        <div class="crisis-badge">
            <i class="fas fa-exclamation-triangle"></i>
            CRISIS - ${reviewItem.crisis_context.priority.toUpperCase()} PRIORITY
        </div>
    ` : '';
    
    const newItem = document.createElement('div');
    newItem.className = 'review-item';
    newItem.innerHTML = `
        ${crisisBadge}
        <div class="review-header">
            <div class="claim-id">CLM-${Date.now()}</div>
            <div class="claim-time">Just now</div>
        </div>
        <div class="claim-content">${reviewItem.claim}</div>
        <div class="ai-assessment">
            <i class="fas fa-robot"></i>
            <div>AI Assessment: ${reviewItem.severity} (Score: ${reviewItem.score.toFixed(2)})</div>
        </div>
        <div class="confidence-meter">
            <div class="confidence-label">
                <span>AI Confidence</span>
                <span>${Math.abs(reviewItem.score * 100).toFixed(0)}%</span>
            </div>
            <div class="confidence-bar">
                <div class="confidence-fill" style="width: ${Math.abs(reviewItem.score * 100)}%"></div>
            </div>
        </div>
        <div class="review-actions">
            <button class="btn btn-verify" onclick="submitReview('${reviewItem.claim}', 'verified', ${isCrisis})">
                <i class="fas fa-check"></i> Verify Claim
            </button>
            <button class="btn btn-false" onclick="submitReview('${reviewItem.claim}', 'false', ${isCrisis})">
                <i class="fas fa-times"></i> Mark as False
            </button>
            <button class="btn btn-disputed" onclick="submitReview('${reviewItem.claim}', 'disputed', ${isCrisis})">
                <i class="fas fa-user-edit"></i> Dispute AI Assessment
            </button>
        </div>
    `;
    
    // Add to the beginning for crisis claims, end for regular claims
    if (isCrisis) {
        reviewItems.insertBefore(newItem, reviewItems.firstChild);
    } else {
        reviewItems.appendChild(newItem);
    }
    
    // Update pending count
    updatePendingCount(1);
    
    // Show notification for crisis claims
    if (isCrisis) {
        showCrisisNotification(reviewItem.claim);
    }
}

function showCrisisNotification(claim) {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = 'crisis-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-exclamation-triangle"></i>
            <strong>New Crisis Claim:</strong> ${claim.substring(0, 100)}...
            <button onclick="this.parentElement.parentElement.remove()" class="close-btn">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

// Enhanced submitReview function
function submitReview(claimId, decision, isCrisis = false) {
    if (isCrisis) {
        // Priority handling for crisis claims
        alert(`🚨 CRISIS CLAIM: ${claimId} marked as ${decision}. Expedited review initiated.`);
        
        // In real implementation, trigger immediate notifications
        if (socketio) {
            socketio.emit('crisis_review_completed', {
                claimId: claimId,
                decision: decision,
                timestamp: new Date().toISOString(),
                priority: 'high'
            });
        }
    } else {
        alert(`Claim ${claimId} marked as ${decision}`);
    }
    
    // Update counts
    updatePendingCount(-1);
    updateReviewedCount(1);
    
    if (decision === 'disputed') {
        updateDisputedCount(1);
    }
    
    // Reload the interface
    loadReviewItems();
    loadHistory();
    
    // For crisis claims, also update crisis stats
    if (isCrisis) {
        loadCrisisStats();
    }
}

function loadReviewItems() {
    // In a real implementation, this would fetch from the API
    // For demo, we'll use static data
    const sampleClaims = [
        {
            id: "CLM-4821",
            time: "2 hours ago",
            content: "The new COVID-19 variant is resistant to all existing vaccines and has a 50% mortality rate.",
            aiAssessment: "Likely False - No evidence supports these extreme claims about vaccine resistance or mortality rate.",
            aiConfidence: 87
        },
        {
            id: "CLM-4820",
            time: "3 hours ago",
            content: "Eating two bananas daily can reduce blood pressure by 10% within a week.",
            aiAssessment: "Partially True - Bananas contain potassium which can help with blood pressure, but the specific claims about quantity and timeframe are exaggerated.",
            aiConfidence: 72
        }
    ];
    
    const reviewItemsContainer = document.getElementById('reviewItems');
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageItems = sampleClaims.slice(startIndex, startIndex + itemsPerPage);
    
    if (pageItems.length > 0) {
        reviewItemsContainer.innerHTML = '';
        
        pageItems.forEach(claim => {
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';
            
            reviewItem.innerHTML = `
                <div class="review-header">
                    <div class="claim-id">${claim.id}</div>
                    <div class="claim-time">${claim.time}</div>
                </div>
                <div class="claim-content">${claim.content}</div>
                <div class="ai-assessment">
                    <i class="fas fa-robot"></i>
                    <div>${claim.aiAssessment}</div>
                </div>
                <div class="confidence-meter">
                    <div class="confidence-label">
                        <span>AI Confidence</span>
                        <span>${claim.aiConfidence}%</span>
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${claim.aiConfidence}%"></div>
                    </div>
                </div>
                <div class="review-actions">
                    <button class="btn btn-verify" onclick="submitReview('${claim.id}', 'verified')">
                        <i class="fas fa-check"></i> Verify Claim
                    </button>
                    <button class="btn btn-false" onclick="submitReview('${claim.id}', 'false')">
                        <i class="fas fa-times"></i> Mark as False
                    </button>
                    <button class="btn btn-disputed" onclick="submitReview('${claim.id}', 'disputed')">
                        <i class="fas fa-user-edit"></i> Dispute AI Assessment
                    </button>
                </div>
            `;
            
            reviewItemsContainer.appendChild(reviewItem);
        });
    } else {
        reviewItemsContainer.innerHTML = `
            <div class="review-item">
                <div class="review-header">
                    <div class="claim-id">No Claims to Review</div>
                </div>
                <div class="claim-content">All pending claims have been reviewed. New claims will appear here as they are flagged by the system.</div>
            </div>
        `;
    }
    
    // Update pagination info
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = Math.ceil(sampleClaims.length / itemsPerPage);
    
    // Disable buttons if needed
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === Math.ceil(sampleClaims.length / itemsPerPage);
}

function loadHistory() {
    // Sample history data
    const sampleHistory = [
        {
            id: "CLM-4818",
            time: "1 hour ago",
            content: "Drinking warm lemon water every morning cures cancer.",
            status: "false",
            reviewer: "John Doe"
        },
        {
            id: "CLM-4817",
            time: "2 hours ago",
            content: "Regular exercise improves cognitive function in older adults.",
            status: "verified",
            reviewer: "Jane Smith"
        }
    ];
    
    const historyList = document.getElementById('historyList');
    
    if (sampleHistory.length > 0) {
        historyList.innerHTML = '';
        
        sampleHistory.forEach(item => {
            const historyItem = document.createElement('li');
            historyItem.className = 'history-item';
            
            const statusClass = item.status === 'verified' ? 'status-verified' : 
                              item.status === 'false' ? 'status-false' : 'status-disputed';
            
            historyItem.innerHTML = `
                <div class="history-header">
                    <div class="history-claim">${item.id}</div>
                    <div class="history-time">${item.time}</div>
                </div>
                <div class="history-content">${item.content}</div>
                <div>
                    <span class="history-status ${statusClass}">${item.status}</span>
                    <span style="font-size: 0.8rem; color: var(--gray); margin-left: 0.5rem;">by ${item.reviewer}</span>
                </div>
            `;
            
            historyList.appendChild(historyItem);
        });
    } else {
        historyList.innerHTML = `
            <li class="history-item">
                <div class="history-header">
                    <div class="history-claim">No Review History</div>
                </div>
                <div class="history-content">Completed reviews will appear here.</div>
            </li>
        `;
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        loadReviewItems();
    }
}

function nextPage() {
    // In a real implementation, this would check against the total pages from the API
    const sampleClaims = [
        {id: "1"}, {id: "2"}, {id: "3"}, {id: "4"}, {id: "5"}
    ];
    const totalPages = Math.ceil(sampleClaims.length / itemsPerPage);
    
    if (currentPage < totalPages) {
        currentPage++;
        loadReviewItems();
    }
}

function submitReview(claimId, decision) {
    // In a real implementation, this would send data to the backend
    alert(`Claim ${claimId} marked as ${decision}. This would be saved to the database in a real implementation.`);
    
    // Update counts
    updatePendingCount(-1);
    updateReviewedCount(1);
    
    if (decision === 'disputed') {
        updateDisputedCount(1);
    }
    
    // Reload the interface
    loadReviewItems();
    loadHistory();
}

function updatePendingCount(change) {
    const pendingCount = document.getElementById('pendingReviewCount');
    if (pendingCount) {
        const current = parseInt(pendingCount.textContent);
        pendingCount.textContent = Math.max(0, current + change);
    }
}

function updateReviewedCount(change) {
    const reviewedCount = document.getElementById('reviewedCount');
    if (reviewedCount) {
        const current = parseInt(reviewedCount.textContent);
        reviewedCount.textContent = current + change;
    }
}

function updateDisputedCount(change) {
    const disputedCount = document.getElementById('disputedCount');
    if (disputedCount) {
        const current = parseInt(disputedCount.textContent);
        disputedCount.textContent = current + change;
    }
}

// Add to human_review.js
function loadCrisisAlerts() {
    fetch('/api/crisis-alerts')
        .then(response => response.json())
        .then(data => {
            // Add crisis badges to review items
            addCrisisContextToReviews(data.alerts);
        })
        .catch(error => console.error('Error loading crisis alerts:', error));
}

function addCrisisContextToReviews(alerts) {
    const reviewItems = document.querySelectorAll('.review-item');
    reviewItems.forEach(item => {
        const claimContent = item.querySelector('.claim-content').textContent;
        const matchingAlert = alerts.find(alert => 
            claimContent.includes(alert.claim.substring(0, 20))
        );
        
        if (matchingAlert) {
            const crisisBadge = document.createElement('div');
            crisisBadge.className = 'crisis-badge';
            crisisBadge.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                ${matchingAlert.crisis_type.toUpperCase()} CRISIS - ${matchingAlert.severity} RISK
            `;
            item.insertBefore(crisisBadge, item.querySelector('.ai-assessment'));
        }
    });
}

// Update the submitReview function for crisis claims
function submitReview(claimId, decision, isCrisis = false) {
    if (isCrisis) {
        // Priority handling for crisis claims
        alert(`🚨 CRISIS CLAIM: ${claimId} marked as ${decision}. Expedited review initiated.`);
        
        // In real implementation, trigger immediate notifications
        if (socketio) {
            socketio.emit('crisis_review_completed', {
                claimId: claimId,
                decision: decision,
                timestamp: new Date().toISOString()
            });
        }
    } else {
        alert(`Claim ${claimId} marked as ${decision}`);
    }
    
    // Update counts and reload
    updatePendingCount(-1);
    updateReviewedCount(1);
    loadReviewItems();
    loadHistory();
}