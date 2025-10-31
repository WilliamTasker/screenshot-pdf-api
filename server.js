// 1. Import the necessary libraries
const express = require('express');
const puppeteer = require('puppeteer-core'); // Use puppeteer-core

// 2. Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3000; // Use port from environment or default to 3000

// 3. Define the main API endpoint for creating PDFs
app.get('/pdf', async (req, res) => {
  // Get the URL from the query parameters (e.g., /pdf?url=https://google.com)
  const urlToCapture = req.query.url;

  if (!urlToCapture) {
    return res.status(400).send({ error: 'URL parameter is required.' });
  }

  let browser;
  try {
    // Launch a headless browser instance
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser', // Specify the path to the browser
      // These arguments are often needed for running in Docker/cloud environments
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Navigate to the provided URL
    console.log(`Navigating to: ${urlToCapture}`);
    await page.goto(urlToCapture, {
      waitUntil: 'networkidle0', // Wait until the network is quiet (page has loaded)
    });

    // Generate the PDF from the page's content
    console.log('Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Include background colors and images
    });

    // 4. Send the PDF back as the response
    // Set headers to tell the client they are receiving a PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="screenshot.pdf"');
    res.send(pdfBuffer);
    console.log('PDF sent successfully.');

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send({ error: 'Failed to generate PDF.', details: error.message });
  } finally {
    // 5. Always close the browser instance to free up resources
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
    }
  }
});