const fs = require('fs');
const path = require('path');

// specific import to avoid issues if node-fetch isn't global
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

async function run() {
    // Create a dummy image file
    const dummyPath = path.join(__dirname, 'test_image.txt');
    fs.writeFileSync(dummyPath, 'fake image content');

    // Create FormData 
    // Since we are in node, we need 'form-data' package or stream it. 
    // To keep it simple without installing deps, we will use a boundary manually? 
    // No, that's complex.

    // Actually, server.js uses 'multer'.
    // Let's try to just check if the ENDPOINT exists first with a simple POST that fails validation but hits code.

    console.log("Testing upload endpoint existence...");
    try {
        const res = await fetch('http://localhost:4000/api/uploads/event-image', {
            method: 'POST'
        });
        console.log(`Endpoint status without file: ${res.status}`);
        // Should be 400 (Image file is required) or 500.
        // If 404, endpoint is missing.

        const text = await res.text();
        console.log(`Response: ${text}`);

    } catch (e) {
        console.error("Connection failed:", e.message);
    }
}

run();
