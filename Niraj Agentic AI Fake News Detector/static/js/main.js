// main.js - Homepage functionality
document.addEventListener('DOMContentLoaded', function() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const claimInput = document.getElementById('claimInput');
    const demoResult = document.getElementById('demoResult');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    analyzeBtn.addEventListener('click', async function() {
        const claimText = claimInput.value.trim();
        
        if (!claimText) {
            alert('Please enter a claim to analyze');
            return;
        }
        
        // Show loading indicator
        loadingIndicator.classList.add('active');
        demoResult.classList.remove('active');
        
        try {
            // Call the analyze API
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: claimText })
            });
            
            const data = await response.json();
            
            // Hide loading indicator
            loadingIndicator.classList.remove('active');
            
            // Display results
            if (data.claims && data.claims.length > 0) {
                let resultHTML = '<h3>Analysis Results:</h3>';
                
                data.claims.forEach((claim, index) => {
                    const verification = data.verification || {};
                    const status = verification.severity || 'Uncertain';
                    const statusClass = status.includes('False') ? 'status-false' : 
                                      status.includes('Credible') ? 'status-verified' : 'status-pending';
                    const statusText = status;
                    
                    resultHTML += `
                        <div class="claim-item">
                            <div class="claim-text"><strong>Claim ${index + 1}:</strong> ${claim}</div>
                            <div class="claim-text"><strong>Analysis:</strong> ${status}</div>
                            <span class="claim-status ${statusClass}">${statusText}</span>
                        </div>
                    `;
                });
                
                if (data.verification && data.verification.confidence) {
                    resultHTML += `<p><strong>Confidence:</strong> ${(data.verification.confidence * 100).toFixed(1)}%</p>`;
                }
                
                demoResult.innerHTML = resultHTML;
            } else if (data.error) {
                demoResult.innerHTML = `<p>Error: ${data.error}</p>`;
            } else {
                demoResult.innerHTML = '<p>No claims detected in the provided text.</p>';
            }
            
            demoResult.classList.add('active');
        } catch (error) {
            console.error('Error analyzing claim:', error);
            loadingIndicator.classList.remove('active');
            demoResult.innerHTML = '<p>Error analyzing claim. Please try again.</p>';
            demoResult.classList.add('active');
        }
    });
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        });
    }
    
    // Update stats with random growth (for demo purposes)
    setInterval(() => {
        const statItems = document.querySelectorAll('.stat-item h3');
        statItems.forEach(item => {
            const currentValue = parseInt(item.textContent.replace(/,/g, ''));
            const growth = Math.floor(Math.random() * 10) + 1;
            const newValue = currentValue + growth;
            item.textContent = newValue.toLocaleString();
        });
    }, 5000);
});