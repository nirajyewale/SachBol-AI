// analysis_claims.js - DEBUG VERSION
console.log('analysis_claims.js loaded successfully!');

// Global variables
let currentPage = 1;
const itemsPerPage = 10;
let allClaims = [];
let filteredClaims = [];

// Initialize immediately when script loads
console.log('Script initialized, waiting for DOM...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Content Loaded - initializing claims page');
    console.log('✅ Table body element:', document.getElementById('claimsTableBody'));
    console.log('✅ Apply filters button:', document.getElementById('applyFilters'));
    
    // Load initial data
    loadAllClaims();

    // Event listeners
    const applyBtn = document.getElementById('applyFilters');
    const resetBtn = document.getElementById('resetFilters');
    const exportBtn = document.getElementById('exportAllData');
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const toggleBtn = document.getElementById('toggleView');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (applyBtn) {
        applyBtn.addEventListener('click', applyFilters);
        console.log('✅ Apply filters button listener added');
    }
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
    if (exportBtn) exportBtn.addEventListener('click', exportAllData);
    if (searchBtn) searchBtn.addEventListener('click', performSearch);
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch();
        });
    }
    if (toggleBtn) toggleBtn.addEventListener('click', toggleView);
    if (prevBtn) prevBtn.addEventListener('click', previousPage);
    if (nextBtn) nextBtn.addEventListener('click', nextPage);

    console.log('✅ All event listeners attached');
});

function loadAllClaims() {
    console.log('🚀 Loading all claims from API...');
    
    // Show loading state
    const tableBody = document.getElementById('claimsTableBody');
    if (!tableBody) {
        console.error('❌ Table body element not found!');
        return;
    }
    
    tableBody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 2rem;">
                <div class="loading-spinner"></div>
                Loading claims...
            </td>
        </tr>
    `;
    
    fetch('/api/claims?category=all&status=all&time_period=all')
        .then(response => {
            console.log('📡 Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('✅ Claims data received:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            allClaims = data.claims || [];
            filteredClaims = [...allClaims];
            
            console.log(`✅ Loaded ${allClaims.length} claims`);
            console.log('Sample claim:', allClaims[0]);
            
            updateClaimsTable();
            updatePagination();
            
            if (allClaims.length === 0) {
                showNotification('No claims data available', 'warning');
            }
        })
        .catch(error => {
            console.error('❌ Error loading claims:', error);
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 2rem; color: var(--danger);">
                            Error loading claims: ${error.message}
                        </td>
                    </tr>
                `;
            }
            showNotification('Error loading claims data: ' + error.message, 'error');
        });
}

function updateClaimsTable() {
    const tableBody = document.getElementById('claimsTableBody');
    const totalClaims = document.getElementById('totalClaims');
    
    console.log('Updating table with', filteredClaims.length, 'filtered claims');
    
    totalClaims.textContent = filteredClaims.length;
    
    if (filteredClaims.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem;">
                    <div class="no-data">
                        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>No claims found matching the current filters.</p>
                        <button class="btn btn-outline" onclick="resetFilters()">Reset Filters</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageClaims = filteredClaims.slice(startIndex, endIndex);

    console.log(`Displaying claims ${startIndex + 1} to ${endIndex} of ${filteredClaims.length}`);

    tableBody.innerHTML = '';

    pageClaims.forEach(claim => {
        const row = document.createElement('tr');
        const statusClass = getStatusClass(claim.status);
        const statusText = getStatusText(claim.status);

        row.innerHTML = `
            <td>CLM-${claim.id.toString().padStart(4, '0')}</td>
            <td class="claim-text">${escapeHtml(claim.text)}</td>
            <td><span class="category-tag">${claim.category}</span></td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${claim.date}</td>
            <td>
                <div class="confidence-meter">
                    <div class="confidence-fill" style="width: ${claim.confidence}%"></div>
                    <span class="confidence-text">${claim.confidence}%</span>
                </div>
            </td>
            <td>${getSourceForClaim(claim.id)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="viewClaim(${claim.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-analyze" onclick="analyzeClaim(${claim.id})" title="Analyze">
                        <i class="fas fa-chart-bar"></i>
                    </button>
                    <button class="btn-action btn-export" onclick="exportClaim(${claim.id})" title="Export">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Helper functions
function getStatusClass(status) {
    const statusMap = {
        'false': 'status-false',
        'verified': 'status-verified', 
        'pending': 'status-pending'
    };
    return statusMap[status] || 'status-pending';
}

function getStatusText(status) {
    const statusMap = {
        'false': 'False',
        'verified': 'Verified',
        'pending': 'Pending'
    };
    return statusMap[status] || 'Unknown';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Rest of your existing functions remain the same...
function applyFilters() {
    const timePeriod = document.getElementById('time-period').value;
    const category = document.getElementById('category').value;
    const status = document.getElementById('status').value;
    const sort = document.getElementById('sort').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    console.log('Applying filters:', { timePeriod, category, status, sort, searchTerm });

    // Apply filters
    filteredClaims = allClaims.filter(claim => {
        let matches = true;
        
        // Category filter
        if (category !== 'all' && claim.category.toLowerCase() !== category.toLowerCase()) {
            matches = false;
        }
        
        // Status filter
        if (status !== 'all' && claim.status !== status) {
            matches = false;
        }
        
        // Search filter
        if (searchTerm && !claim.text.toLowerCase().includes(searchTerm)) {
            matches = false;
        }
        
        return matches;
    });

    console.log('After filtering:', filteredClaims.length, 'claims remaining');

    // Apply sorting
    filteredClaims.sort((a, b) => {
        switch (sort) {
            case 'date_desc':
                return new Date(b.date) - new Date(a.date);
            case 'date_asc':
                return new Date(a.date) - new Date(b.date);
            case 'confidence_desc':
                return b.confidence - a.confidence;
            case 'confidence_asc':
                return a.confidence - b.confidence;
            default:
                return 0;
        }
    });

    currentPage = 1;
    updateClaimsTable();
    updatePagination();
    
    showNotification(`Applied filters: ${filteredClaims.length} claims found`);
}


function applyFilters() {
    const timePeriod = document.getElementById('time-period').value;
    const category = document.getElementById('category').value;
    const status = document.getElementById('status').value;
    const sort = document.getElementById('sort').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    console.log('Applying filters:', { timePeriod, category, status, sort, searchTerm });

    // Apply filters
    filteredClaims = allClaims.filter(claim => {
        let matches = true;
        
        // Category filter
        if (category !== 'all' && claim.category.toLowerCase() !== category.toLowerCase()) {
            console.log('Filtered by category:', claim.category, category);
            matches = false;
        }
        
        // Status filter
        if (status !== 'all' && claim.status !== status) {
            console.log('Filtered by status:', claim.status, status);
            matches = false;
        }
        
        // Search filter
        if (searchTerm && !claim.text.toLowerCase().includes(searchTerm)) {
            console.log('Filtered by search:', claim.text, searchTerm);
            matches = false;
        }
        
        // Time period filter (simplified - in real app you'd check actual dates)
        if (timePeriod !== 'all') {
            // This is a simplified time filter - in a real app you'd check actual dates
            const claimDate = new Date(claim.date);
            const now = new Date();
            let daysAgo = 0;
            
            switch (timePeriod) {
                case '7d': daysAgo = 7; break;
                case '30d': daysAgo = 30; break;
                case '90d': daysAgo = 90; break;
            }
            
            if (daysAgo > 0) {
                const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
                if (claimDate < cutoffDate) {
                    console.log('Filtered by time period:', claim.date, timePeriod);
                    matches = false;
                }
            }
        }
        
        return matches;
    });

    console.log('After filtering:', filteredClaims.length, 'claims remaining');

    // Apply sorting
    filteredClaims.sort((a, b) => {
        switch (sort) {
            case 'date_desc':
                return new Date(b.date) - new Date(a.date);
            case 'date_asc':
                return new Date(a.date) - new Date(b.date);
            case 'confidence_desc':
                return b.confidence - a.confidence;
            case 'confidence_asc':
                return a.confidence - b.confidence;
            default:
                return 0;
        }
    });

    currentPage = 1;
    updateClaimsTable();
    updatePagination();
    
    showNotification(`Applied filters: ${filteredClaims.length} claims found`);
}

function resetFilters() {
    console.log('Resetting filters');
    
    document.getElementById('time-period').value = 'all';
    document.getElementById('category').value = 'all';
    document.getElementById('status').value = 'all';
    document.getElementById('sort').value = 'date_desc';
    document.getElementById('searchInput').value = '';
    
    filteredClaims = [...allClaims];
    currentPage = 1;
    updateClaimsTable();
    updatePagination();
    
    showNotification('Filters reset');
}

function performSearch() {
    console.log('Performing search');
    applyFilters();
}

function toggleView() {
    showNotification('View toggled - this would switch between table and card views');
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        updateClaimsTable();
        updatePagination();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredClaims.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updateClaimsTable();
        updatePagination();
    }
}

function updatePagination() {
    const totalPages = Math.ceil(filteredClaims.length / itemsPerPage);
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages || totalPages === 0;
    
    console.log('Pagination updated:', currentPage, 'of', totalPages);
}

function exportAllData() {
    const dataStr = JSON.stringify({ claims: filteredClaims }, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `all-claims-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('All claims exported successfully!');
}

function viewClaim(claimId) {
    showNotification(`Viewing claim #${claimId}`);
    // In real implementation, navigate to claim details
}

function analyzeClaim(claimId) {
    showNotification(`Analyzing claim #${claimId}`);
    // In real implementation, perform analysis
}

function getSourceForClaim(claimId) {
    const sources = ['Twitter', 'Facebook', 'News Site', 'Blog', 'Forum'];
    return sources[claimId % sources.length];
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

// Debug function to check what's happening
function debugClaims() {
    console.log('All claims:', allClaims);
    console.log('Filtered claims:', filteredClaims);
    console.log('Current page:', currentPage);
}