const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = 3000;

// Functie om prijzen en prijs per kg/liter te scrapen van verschillende supermarkten
async function scrapePriceAH(product) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`https://www.ah.nl/zoeken?query=${product}`);
    
    const result = await page.evaluate(() => {
        let priceElement = document.querySelector('[data-testhook="price"]');
        let pricePerUnitElement = document.querySelector('[data-testhook="price-per-unit"]');
        
        let price = priceElement ? parseFloat(priceElement.innerText.replace(',', '.')) : null;
        let pricePerUnit = pricePerUnitElement ? pricePerUnitElement.innerText : null;
        
        return { price, pricePerUnit };
    });
    
    await browser.close();
    return result;
}

async function scrapePriceJumbo(product) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`https://www.jumbo.com/zoeken?searchTerms=${product}`);
    
    const result = await page.evaluate(() => {
        let priceElement = document.querySelector('.jum-price__integer');
        let pricePerUnitElement = document.querySelector('.jum-price__unit');
        
        let price = priceElement ? parseFloat(priceElement.innerText + '.00') : null;
        let pricePerUnit = pricePerUnitElement ? pricePerUnitElement.innerText : null;
        
        return { price, pricePerUnit };
    });
    
    await browser.close();
    return result;
}

async function scrapePriceMakro(product) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`https://www.makro.nl/search?text=${product}`);
    
    const result = await page.evaluate(() => {
        let priceElement = document.querySelector('.product-price');
        let pricePerUnitElement = document.querySelector('.product-price-per-unit');
        
        let price = priceElement ? parseFloat(priceElement.innerText.replace(',', '.')) : null;
        let pricePerUnit = pricePerUnitElement ? pricePerUnitElement.innerText : null;
        
        return { price, pricePerUnit };
    });
    
    await browser.close();
    return result;
}

async function scrapePricePlus(product) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`https://www.plus.nl/zoekresultaten?searchQuery=${product}`);
    
    const result = await page.evaluate(() => {
        let priceElement = document.querySelector('.product-tile__price');
        let pricePerUnitElement = document.querySelector('.product-tile__price-per-unit');
        
        let price = priceElement ? parseFloat(priceElement.innerText.replace(',', '.')) : null;
        let pricePerUnit = pricePerUnitElement ? pricePerUnitElement.innerText : null;
        
        return { price, pricePerUnit };
    });
    
    await browser.close();
    return result;
}

// Endpoint om de goedkoopste supermarkt en prijs per kg/liter te vinden voor een product
app.get('/compare/:product', async (req, res) => {
    const product = req.params.product.toLowerCase();
    
    try {
        const [ahData, jumboData, makroData, plusData] = await Promise.all([
            scrapePriceAH(product),
            scrapePriceJumbo(product),
            scrapePriceMakro(product),
            scrapePricePlus(product)
        ]);

        const prices = {
            "Albert Heijn": ahData,
            "Jumbo": jumboData,
            "Makro": makroData,
            "PLUS": plusData
        };

        const cheapestStore = Object.keys(prices).reduce((cheapest, store) => 
            prices[store].price !== null && (prices[store].price < prices[cheapest].price || prices[cheapest].price === null) ? store : cheapest, null
        );
        
        res.json({
            product,
            cheapest: cheapestStore,
            price: prices[cheapestStore].price,
            pricePerUnit: prices[cheapestStore].pricePerUnit,
            allPrices: prices
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Fout bij het scrapen van prijzen." });
    }
});

app.listen(port, () => {
    console.log(`Boodschappenchecker backend draait op http://localhost:${port}`);
});
