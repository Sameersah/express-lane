const API_BASE = 'http://localhost:3000/api';

// Load sample receipts
async function loadSamples() {
    try {
        const response = await fetch(`${API_BASE}/samples`);
        const samples = await response.json();
        
        const container = document.getElementById('samples-container');
        container.innerHTML = samples.map(sample => `
            <button onclick="processSample('${sample.id}')" 
                class="w-full text-left bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 rounded-lg p-4 transition duration-200 transform hover:scale-102">
                <div class="flex justify-between items-center">
                    <div>
                        <div class="font-bold text-gray-800">${sample.name}</div>
                        <div class="text-sm text-gray-600">${sample.orderId} • ${sample.payer}</div>
                    </div>
                    <div class="text-xl font-bold text-blue-600">
                        $${sample.amount.toFixed(2)}
                    </div>
                </div>
            </button>
        `).join('');
        
        // Store samples for later use
        window.samples = samples;
    } catch (error) {
        console.error('Failed to load samples:', error);
    }
}

// Process sample payment
async function processSample(sampleId) {
    const sample = window.samples.find(s => s.id === sampleId);
    if (!sample) return;
    
    await processPayment(sample);
}

// Process payment from form
document.getElementById('payment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const receipt = {
        orderId: document.getElementById('orderId').value,
        amount: parseFloat(document.getElementById('amount').value),
        currency: 'USD',
        payer: document.getElementById('payer').value,
        description: document.getElementById('description').value || `Payment from ${document.getElementById('payer').value}`,
        timestamp: new Date().toISOString(),
        source: 'web',
    };
    
    await processPayment(receipt);
});

// Main payment processing function
async function processPayment(receipt) {
    // Show progress container
    const progressContainer = document.getElementById('progress-container');
    const resultsContainer = document.getElementById('results-container');
    const progressSteps = document.getElementById('progress-steps');
    
    progressContainer.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    
    // Define steps
    const steps = [
        { emoji: '📨', text: 'Reading payment message...', delay: 300 },
        { emoji: '💳', text: 'Verifying payment...', delay: 500 },
        { emoji: '📋', text: 'Creating Jira task...', delay: 400 },
        { emoji: '📘', text: 'Adding Notion entry...', delay: 400 },
        { emoji: '🔔', text: 'Sending Slack confirmation...', delay: 300 },
    ];
    
    // Animate steps
    progressSteps.innerHTML = '';
    for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, step.delay));
        const stepEl = document.createElement('div');
        stepEl.className = 'flex items-center space-x-3 text-gray-700 slide-in';
        stepEl.innerHTML = `
            <span class="text-2xl">${step.emoji}</span>
            <span class="pulse-slow">${step.text}</span>
        `;
        progressSteps.appendChild(stepEl);
    }
    
    // Call API
    try {
        const response = await fetch(`${API_BASE}/process-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(receipt),
        });
        
        const result = await response.json();
        
        // Show results
        await new Promise(resolve => setTimeout(resolve, 500));
        displayResults(result);
        
        // Hide progress, show results
        progressContainer.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        
    } catch (error) {
        console.error('Processing error:', error);
        displayError(error.message);
        progressContainer.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
    }
}

// Display results
function displayResults(result) {
    const resultsContent = document.getElementById('results-content');
    
    if (result.success) {
        resultsContent.innerHTML = `
            <div class="space-y-4">
                <!-- Success Header -->
                <div class="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div class="flex items-center space-x-2 text-green-800">
                        <span class="text-2xl">✅</span>
                        <span class="font-bold text-lg">Payment Processed Successfully!</span>
                    </div>
                </div>
                
                <!-- Receipt Info -->
                <div class="border-2 border-gray-200 rounded-lg p-4">
                    <h3 class="font-bold text-gray-800 mb-2">🧾 Receipt Details</h3>
                    <div class="space-y-1 text-sm">
                        <div><span class="font-medium">Order ID:</span> ${result.receipt.orderId}</div>
                        <div><span class="font-medium">Amount:</span> $${result.receipt.amount.toFixed(2)} ${result.receipt.currency}</div>
                        <div><span class="font-medium">Payer:</span> ${result.receipt.payer}</div>
                        <div><span class="font-medium">Source:</span> ${result.receipt.source}</div>
                    </div>
                </div>
                
                <!-- Verification -->
                <div class="border-2 border-gray-200 rounded-lg p-4">
                    <h3 class="font-bold text-gray-800 mb-2">💳 Payment Verification</h3>
                    <div class="space-y-1 text-sm">
                        <div><span class="font-medium">Status:</span> <span class="text-green-600 font-bold">${result.verification.status.toUpperCase()}</span></div>
                        <div><span class="font-medium">Verified:</span> ${result.verification.verified ? '✓ Yes' : '✗ No'}</div>
                        ${result.verification.transactionId ? `<div><span class="font-medium">Transaction ID:</span> ${result.verification.transactionId}</div>` : ''}
                    </div>
                </div>
                
                <!-- Jira -->
                ${result.jiraIssue ? `
                <div class="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h3 class="font-bold text-gray-800 mb-2">📋 Jira Task Created</h3>
                    <div class="space-y-1 text-sm">
                        <div><span class="font-medium">Issue Key:</span> <span class="font-mono font-bold text-blue-600">${result.jiraIssue.key}</span></div>
                        <div><span class="font-medium">URL:</span> <a href="${result.jiraIssue.url}" target="_blank" class="text-blue-600 underline">${result.jiraIssue.url}</a></div>
                    </div>
                </div>
                ` : ''}
                
                <!-- Notion -->
                ${result.notionPage ? `
                <div class="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                    <h3 class="font-bold text-gray-800 mb-2">📘 Notion Entry Created</h3>
                    <div class="space-y-1 text-sm">
                        <div><span class="font-medium">Page ID:</span> <span class="font-mono text-xs">${result.notionPage.id}</span></div>
                        <div><span class="font-medium">URL:</span> <a href="${result.notionPage.url}" target="_blank" class="text-purple-600 underline">View in Notion</a></div>
                    </div>
                </div>
                ` : ''}
                
                <!-- Slack -->
                <div class="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                    <h3 class="font-bold text-gray-800 mb-2">🔔 Slack Notification</h3>
                    <div class="text-sm text-green-700">
                        ✓ Confirmation message posted to Slack
                    </div>
                </div>
                
                <!-- Summary -->
                <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
                    <div class="text-center">
                        <div class="text-3xl mb-2">🎉</div>
                        <div class="font-bold text-gray-800">Complete Automation in Seconds!</div>
                        <div class="text-sm text-gray-600 mt-1">
                            Payment verified, tracked in Jira, logged in Notion, and team notified.
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        resultsContent.innerHTML = `
            <div class="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div class="flex items-center space-x-2 text-red-800 mb-2">
                    <span class="text-2xl">❌</span>
                    <span class="font-bold text-lg">Processing Failed</span>
                </div>
                <div class="text-sm text-red-700">
                    ${result.error || 'An error occurred during processing'}
                </div>
                ${result.errors && result.errors.length > 0 ? `
                    <ul class="mt-2 space-y-1 text-sm text-red-600">
                        ${result.errors.map(err => `<li>• ${err}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        `;
    }
}

// Display error
function displayError(message) {
    const resultsContent = document.getElementById('results-content');
    resultsContent.innerHTML = `
        <div class="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div class="flex items-center space-x-2 text-red-800 mb-2">
                <span class="text-2xl">❌</span>
                <span class="font-bold text-lg">Error</span>
            </div>
            <div class="text-sm text-red-700">
                ${message}
            </div>
        </div>
    `;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSamples();
});

