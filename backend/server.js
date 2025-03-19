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
    // const browser = await puppeteer.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
    );

    try {
        const url = `https://www.ah.nl/zoeken?query=${product}&sortBy=price`;
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        // Accepteer cookies als ze er zijn
        const cookieButtonSelector = '[data-testhook="accept-cookies"]';
        if (await page.$(cookieButtonSelector)) {
            await page.click(cookieButtonSelector);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log("✅ Pagina geladen, cookies geaccepteerd indien nodig");

        // Wacht op producten
        const productSelector = '[class*="product-card"]';
        await page.waitForSelector(productSelector, { timeout: 10000 });

        // Zoek alle producten op de pagina
        const products = await page.$$(productSelector);
        console.log(`🔍 Aantal gevonden producten: ${products.length}`);
        
        for (let i = 0; i < Math.min(products.length, 5); i++) { // Max 5 om niet te spammen
            let titleElement = await products[i].$('[data-testhook="product-title"]');
            var title = titleElement ? await page.evaluate(el => el.innerText, titleElement) : "Geen titel gevonden";
        }      

        let cheapestProduct = null;
        let cheapestPrice = Infinity;
        let cheapestImageUrl = null;

        for (const product of products) {
            const priceElement = await product.$('[aria-label^="Prijs: €"]');
            if (priceElement) {
                let priceText = await page.evaluate(el => el.getAttribute('aria-label').replace('Prijs: €', '').replace(',', '.'), priceElement);
                let price = parseFloat(priceText);
                if (price < cheapestPrice) {
                    cheapestPrice = price;
                    cheapestProduct = product;

                    // Afbeelding ophalen
                    const imageElement = await cheapestProduct.$('[data-testhook="product-image"]');
                    cheapestImageUrl = imageElement ? await page.evaluate(el => el.src, imageElement) : null;
                }
            }
        }

        if (!cheapestProduct) {
            console.warn("❌ Geen producten gevonden.");
            await browser.close();
            return { product, price: "Niet beschikbaar", unitSize: "Niet beschikbaar", pricePerUnit: "Niet beschikbaar", imageUrl: null };
        }

        // Unit size ophalen
        const unitSizeSelector = '[data-testhook="product-unit-size"]';
        let unitSizeText = null;
        let unitSizeInGrams = null;

        const unitSizeElement = await cheapestProduct.$(unitSizeSelector);
        if (unitSizeElement) {  
            unitSizeText = await page.evaluate(el => el.innerText.trim(), unitSizeElement);
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

        // Prijs per kilo berekenen
        let pricePerUnit = null;
        if (unitSizeInGrams) {
            pricePerUnit = (cheapestPrice / (unitSizeInGrams / 1000)).toFixed(2);
        }

        await browser.close();

        console.log("🔹 Prijs:", cheapestPrice);
        console.log("🔹 Unit Size:", unitSizeText);
        console.log("🔹 Price per Kilo:", pricePerUnit);
        console.log("🔹 Image URL:", cheapestImageUrl);
        console.log("✅ AH Scraping voltooid voor:", product);

        return { product, title, price: cheapestPrice, unitSize: unitSizeText, pricePerUnit, imageUrl: cheapestImageUrl };
    } catch (error) {
        console.error("Fout tijdens scraping:", error);
        await browser.close();
        return { product, title, price: "Niet beschikbaar", unitSize: "Niet beschikbaar", pricePerUnit: "Niet beschikbaar", imageUrl: null };
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
        const url = `https://www.jumbo.com/producten/?searchType=keyword&searchTerms=${product}&sort=price+asc`;
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Prijs ophalen
        const priceSelector = '.current-price .screenreader-only';
        await page.waitForSelector(priceSelector);
        const priceText = await page.evaluate(() => {
            const priceElement = document.querySelector('.current-price .screenreader-only');
            return priceElement ? priceElement.innerText.replace('Prijs: €', '').trim() : null;
        });
        const price = priceText ? parseFloat(priceText.replace(',', '.')) : null;

        // Prijs per eenheid ophalen
        const unitPriceSelector = '[class*="price-per-unit"]';
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
        
        console.log("🔹 Prijs:", price);
        console.log("🔹 Image URL:", imageUrl);
        console.log("🔹 Prijs per unit:", pricePerUnit);
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