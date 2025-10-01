// Test the structure around the problematic area
const doRender = async () => {
  let browser;
  try {
    console.log('Starting...');
    
    // Simulate the browser launch section
    try {
      browser = await puppeteer.launch(launchOptions);
      console.log('Browser launched successfully');
    } catch (launchError) {
      console.error('Browser launch failed:', launchError);
      
      // Try with minimal options as fallback
      console.log('Attempting browser launch with minimal options...');
      const minimalOptions = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        timeout: 60000
      };
      
      try {
        browser = await puppeteer.launch(minimalOptions);
        console.log('Browser launched with minimal options');
      } catch (minimalError) {
        console.error('Minimal browser launch also failed:', minimalError);
        
        // Try ultra-minimal options
        console.log('Attempting ultra-minimal browser launch...');
        const ultraMinimalOptions = {
          headless: true,
          args: ['--no-sandbox'],
          timeout: 90000
        };
        
        try {
          browser = await puppeteer.launch(ultraMinimalOptions);
          console.log('Browser launched with ultra-minimal options');
        } catch (ultraMinimalError) {
          console.error('Ultra-minimal browser launch also failed:', ultraMinimalError);
          throw new Error(`All browser launch attempts failed.`);
        }
      }
    }
    
    // Continue with PDF generation
    console.log('PDF generated successfully');
    
    await browser.close();
    return pdf;
  } catch (e) {
    console.error('Error during PDF generation:', e);
    
    if (browser) {
      try {
        console.log('Closing browser after error...');
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    throw e;
  }
};