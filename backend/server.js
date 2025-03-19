const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cors = require('cors');

puppeteer.use(StealthPlugin());
const app = express();
const port = 3001;

app.use(cors({
    origin: "http://localhost:3000", // Sta alleen verzoeken van je frontend toe
    methods: "GET", // Sta alleen GET-verzoeken toe
    allowedHeaders: ["Content-Type"]
  }));
  

async function scrapeAH(product) {
    console.log(`Scraping Albert Heijn voor: ${product}`);
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
    );

    try {
        const url = `https://www.ah.nl/zoeken?query=${product}`;
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        const cookieButtonSelector = '[data-testhook="accept-cookies"]';
        if (await page.$(cookieButtonSelector)) {
            await page.click(cookieButtonSelector);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const productSelector = '[class*="product-card"]';
        await page.waitForSelector(productSelector, { timeout: 10000 });
                
        const priceElement = await page.$('[aria-label^="Prijs: €"]');
        let price = null;
        if (priceElement) {
            price = await page.evaluate(el => el.getAttribute('aria-label').replace('Prijs: €', '').replace(',', '.'), priceElement);
            price = parseFloat(price);
        }
        
        const imageSelector = '[data-testhook="product-image"]';
        const imageUrl = await page.evaluate(() => {
            const imgElement = document.querySelector('[data-testhook="product-image"]');
            return imgElement ? imgElement.src : null;
        });


        const unitSizeSelector = '[data-testhook="product-unit-size"]';
        await page.waitForSelector(unitSizeSelector, { timeout: 5000 });

        const unitSizeText = await page.evaluate(() => {
            let unitSizeElement = document.querySelector('[data-testhook="product-unit-size"]');
            return unitSizeElement ? unitSizeElement.innerText.trim() : null;            
        });

        let unitSizeInGrams = null;
        if (unitSizeText) {
            const match = unitSizeText.match(/([\d,.]+)\s*(g|kg|ml|l)/i);
            if (match) {
                let value = parseFloat(match[1].replace(',', '.'));
                let unit = match[2].toLowerCase();
                if (unit === "kg" || unit === "l") {
                    value *= 1000; // kg/l omzetten naar gram/ml
                }
                unitSizeInGrams = value;
            }
        }

        let pricePerKilo = null;
        if (unitSizeInGrams && price) {
            pricePerKilo = (price / (unitSizeInGrams / 1000)).toFixed(2); // Omrekenen naar €/kg
        }

        await browser.close();

        console.log("🔹 Price:", price);
        console.log("🔹 Unit Size:", unitSizeText);
        console.log("🔹 Unit Size in Grams:", unitSizeInGrams);
        console.log("🔹 Price per Kilo:", pricePerKilo);
        console.log(`✅ Albert Heijn scraper voltooid voor: ${product}`);


        return { product, price: price || "Niet beschikbaar", unitSize: unitSizeText, pricePerKilo, imageUrl  };
    } catch (error) {
        console.error("Fout tijdens scraping:", error);
        await browser.close();
        return { product, price: price || "Niet beschikbaar", unitSize: unitSizeText, pricePerKilo, imageUrl  };
    }
}

async function scrapeJumbo(product) {
    console.log(`Scraping Jumbo voor: ${product}`);
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
    );

    try {
        const url = `https://www.jumbo.com/producten/?searchType=keyword&searchTerms=${product}`;
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Sorteer op prijs (laag - hoog)
        const sortSelector = '[data-testid="select-options"]';
        await page.waitForSelector(sortSelector);
        await page.select(sortSelector, `/producten/?searchType=keyword&searchTerms=${product}&sort=price+asc`);
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

        // Prijs ophalen
        const priceSelector = '.current-price .screenreader-only';
        await page.waitForSelector(priceSelector);
        const priceText = await page.evaluate(() => {
            const priceElement = document.querySelector('.current-price .screenreader-only');
            return priceElement ? priceElement.innerText.replace('Prijs: €', '').trim() : null;
        });
        const price = priceText ? parseFloat(priceText.replace(',', '.')) : null;

        // Prijs per eenheid ophalen
        const unitPriceSelector = '.price-per-unit .screenreader-only';
        await page.waitForSelector(unitPriceSelector);
        const unitPriceText = await page.evaluate(() => {
            const unitPriceElement = document.querySelector('.price-per-unit .screenreader-only');
            return unitPriceElement ? unitPriceElement.innerText.trim() : null;
        });

        // Extract de prijs per eenheid (bijv. € 0,92 per liter)
        let pricePerUnit = null;
        let unitSize = null;
        if (unitPriceText) {
            const match = unitPriceText.match(/€\s*([\d,.]+)\s*per\s*(\w+)/i);
            if (match) {
                pricePerUnit = parseFloat(match[1].replace(',', '.'));
                unitSize = match[2]; // Bijv. 'liter' of 'kg'
            }
        }

        const imageSelector = '.image-container img';
        const imageUrl = await page.evaluate(() => {
            const imgElement = document.querySelector('.image-container img');
            return imgElement ? imgElement.src : null;
        });


        await browser.close();
        
        console.log("🔹 Price:", price);
        console.log("🔹 Price per Kilo:", pricePerUnit);
        console.log(`✅ Jumbo scraper voltooid voor: ${product}`);

        return { product, price, pricePerUnit, unitSize, imageUrl  };
    } catch (error) {
        console.error("Fout tijdens scraping Jumbo:", error);
        await browser.close();
        return { product, price: "Niet beschikbaar", pricePerUnit: "Niet beschikbaar", unitSize: "Niet beschikbaar", imageUrl  };
    }
}


app.get('/api/compare/:product', async (req, res) => {
    const product = req.params.product;
    console.log(`Ontvangen verzoek voor: ${product}`);

    const [ahData, jumboData] = await Promise.all([
        scrapeAH(product),
        scrapeJumbo(product)
    ]);

    res.json({ AlbertHeijn: ahData, Jumbo: jumboData });
});

app.listen(port, () => {
    console.log(`API draait op http://localhost:${port}`);
});