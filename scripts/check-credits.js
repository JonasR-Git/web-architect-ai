const fs = require('fs');
const path = require('path');
const https = require('https');

// Path to .env.local
const envPath = path.resolve(__dirname, '../.env.local');

// 1. Read API Key manually to avoid dependencies
let apiKey = null;

try {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/OPENROUTER_API_KEY=(.+)/);
        if (match && match[1]) {
            apiKey = match[1].trim();
            // Remove quotes if present
            if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
                apiKey = apiKey.slice(1, -1);
            }
        }
    }
} catch (e) {
    console.error('Error reading .env.local:', e);
}

if (!apiKey) {
    console.error('❌ Error: OPENROUTER_API_KEY not found in .env.local');
    console.log('Please make sure .env.local exists in the project root and contains OPENROUTER_API_KEY=...');
    process.exit(1);
}

// 2. Query OpenRouter API for Key Details (Detailed Limits)
console.log('🔍 Checking OpenRouter limits...');

const options = {
    hostname: 'openrouter.ai',
    path: '/api/v1/auth/key',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            if (res.statusCode !== 200) {
                throw new Error(`API returned ${res.statusCode}: ${data}`);
            }

            const json = JSON.parse(data);

            console.log('\n📊 OpenRouter Authorization Status');
            console.log('================================');

            if (json.data) {
                const limit = json.data.limit || 0;
                const creditLimit = json.data.limit_remaining || 0; // Credits remaining (IMPORTANT)
                const usage = json.data.usage || 0; // Total usage
                const isFree = limit <= 0 && creditLimit <= 0;

                // Color codes
                const reset = "\x1b[0m";
                const bright = "\x1b[1m";
                const green = "\x1b[32m";
                const red = "\x1b[31m";
                const yellow = "\x1b[33m";
                const cyan = "\x1b[36m";

                console.log(`💰 Credits Remaining:   ${creditLimit > 0 ? green : red}$${creditLimit.toFixed(4)}${reset}`);
                console.log(`📉 Total Usage:         $${usage.toFixed(4)}`);

                console.log('--------------------------------');
                if (creditLimit > 0) {
                    // Paid tier logic
                    console.log(`🚀 ${bright}High Tier Active${reset} (Credits Available)`);
                    console.log(`   Free Model Limit:    ${green}~1000 requests / day${reset}`);
                    console.log(`   Detailed Limit:      20 req/min for free models.`);
                    console.log(`   Paid Models:         ${cyan}Unlimited (as long as credits last)${reset}`);
                } else {
                    // Free tier logic
                    console.log(`🐢 ${yellow}Free Tier Active${reset} (No Credits)`);
                    console.log(`   Free Model Limit:    ${red}~50 requests / day${reset}`);
                    console.log(`   Concurrency:         ${red}20 requests / min${reset}`);
                }

                console.log('\nNOTE: The "200 daily requests" limit applies to purely free accounts.');
                console.log('Because you have paid credits, your free model limit is significantly higher (usually 1000/day).');

            } else {
                console.log('Unknown response format:', json);
            }

        } catch (e) {
            console.error('❌ Error processing response:', e.message);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request error:', e);
});

req.end();
