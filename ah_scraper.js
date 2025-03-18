const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeAH(product) {
    console.log(`Start scraping Albert Heijn voor: ${product}`);
    
    const browser = await puppeteer.launch({ headless: true }); // Zet op true voor snelheid
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 800 });
    
    // Gebruik een geldige User-Agent om detectie te voorkomen
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
    );
    
    try {
        const url = `https://www.ah.nl/zoeken?query=${product}`;
        console.log(`Navigeren naar: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        // Check of de cookie-popup verschijnt en accepteer deze
        const cookieButtonSelector = '[data-testhook="accept-cookies"]';
        if (await page.$(cookieButtonSelector)) {
            console.log("Cookie-popup gevonden. Accepteren...");
            await page.click(cookieButtonSelector);
            await page.waitForTimeout(2000); // Kortere wachttijd
        }
        
        // Wachten op het eerste product in de lijst
        const productSelector = '[class*="product-card"]';
        await page.waitForSelector(productSelector, { timeout: 10000 });
        console.log("Producten gevonden op de zoekpagina.");
        
        // Klik op het eerste product om de productpagina te openen
        const productElement = await page.$(`${productSelector} a`);
        if (!productElement) {
            console.warn("Geen productlink gevonden.");
            await browser.close();
            return;
        }
        
        const productLink = await page.evaluate(el => el.href, productElement);
        console.log(`Product gevonden: ${productLink}`);
        await page.goto(productLink, { waitUntil: 'domcontentloaded' });
        
        // Wachten op de prijs
        const priceSelector = '[aria-label^="Prijs: €"]';
        await page.waitForSelector(priceSelector, { timeout: 10000 });
        console.log("Prijsinformatie gevonden op productpagina.");
        
        // Prijs ophalen
        const price = await page.evaluate(() => {
            let priceElement = document.querySelector('[aria-label^="Prijs: €"]');
            return priceElement ? priceElement.getAttribute('aria-label').replace('Prijs: €', '').trim() : null;
        });
        
        // Prijs per eenheid ophalen
        const pricePerUnitSelector = '.product-card-header_unitPriceWithPadding__oW5Pe';
        const pricePerUnit = await page.evaluate(() => {
            let unitPriceElement = document.querySelector('.product-card-header_unitPriceWithPadding__oW5Pe');
            return unitPriceElement ? unitPriceElement.innerText.replace('Prijs per', '').trim() : null;
        });
        
        console.log(`Gevonden prijs: €${price}, Prijs per eenheid: ${pricePerUnit}`);
        return { product, price, pricePerUnit };
    } catch (error) {
        console.error("Fout tijdens scraping:", error);
    } finally {
        await browser.close();
    }
}

async function parallelScraping(products) {
    console.log("Start parallel scraping...");
    const results = await Promise.all(products.map(product => scrapeAH(product)));
    console.log("Scraping voltooid:", results);
    return results;
}

parallelScraping(["melk", "kaas", "brood"]);