const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cors = require('cors');

puppeteer.use(StealthPlugin());
const app = express();
const port = 3001;

app.use(cors());

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
            await page.waitForTimeout(2000);
        }
        
        const productSelector = '[class*="product-card"]';
        await page.waitForSelector(productSelector, { timeout: 10000 });
        
        const productElement = await page.$(`${productSelector} a`);
        if (!productElement) {
            await browser.close();
            return { product, price: null, pricePerUnit: null };
        }
        
        const productLink = await page.evaluate(el => el.href, productElement);
        await page.goto(productLink, { waitUntil: 'domcontentloaded' });
        
        const priceSelector = '[aria-label^="Prijs: €"]';
        await page.waitForSelector(priceSelector, { timeout: 10000 });
        
        const price = await page.evaluate(() => {
            let priceElement = document.querySelector('[aria-label^="Prijs: €"]');
            return priceElement ? priceElement.getAttribute('aria-label').replace('Prijs: €', '').trim() : null;
        });

        const pricePerUnitSelector = '.product-card-header_unitPriceWithPadding__oW5Pe';
        const pricePerUnit = await page.evaluate(() => {
            let unitPriceElement = document.querySelector('.product-card-header_unitPriceWithPadding__oW5Pe');
            return unitPriceElement ? unitPriceElement.innerText.replace('Prijs per', '').trim() : null;
        });

        await browser.close();
        return { product, price, pricePerUnit };
    } catch (error) {
        console.error("Fout tijdens scraping:", error);
        await browser.close();
        return { product, price: null, pricePerUnit: null };
    }
}

app.get('/api/compare/:product', async (req, res) => {
    const product = req.params.product;
    console.log(`Ontvangen verzoek voor: ${product}`);
    const result = await scrapeAH(product);
    res.json(result);
});

app.listen(port, () => {
    console.log(`API draait op http://localhost:${port}`);
});
