# Boodschappenchecker

Een webapplicatie om prijzen van supermarktproducten te vergelijken tussen verschillende winkels.

## 📦 Installatie

### 1. Clone de repository
Als je het project nog niet hebt, clone het vanaf GitHub:
```sh
git clone https://github.com/Michelijo/boodschappenchecker.git
cd boodschappenchecker
```

Als je het project al hebt en wilt updaten:
```sh
cd boodschappenchecker
git pull origin main
```

---

### 2. Backend opzetten
Ga naar de backend-map en installeer de benodigde libraries:
```sh
cd backend
npm install
```

**Benodigde libraries:**
- `express` - Voor de API-server
- `puppeteer-extra` - Web scraping
- `puppeteer-extra-plugin-stealth` - Vermijden van bot-detectie
- `cors` - Toegang toestaan vanuit de frontend

**Start de backend:**
```sh
node server.js
```

✅ **Test of de backend werkt:** Ga naar [`http://localhost:3001/api/compare/melk`](http://localhost:3001/api/compare/melk)

---

### 3. Frontend opzetten
Ga naar de frontend-map en installeer de dependencies:
```sh
cd ../boodschappen-frontend
npm install
```

**Benodigde libraries:**
- `next` - Frontend framework
- `react` & `react-dom` - UI-componenten
- `@shadcn/ui` - Standaard UI-componenten
- `tailwindcss postcss autoprefixer` - Styling

**Start de frontend:**
```sh
npm run dev
```

✅ **Ga naar [`http://localhost:3000/`](http://localhost:3000/) om de app te bekijken.**

---

## 🔹 Extra Configuratie

### 1. Tailwind CSS handmatig instellen (als nodig)
Als Tailwind niet werkt, controleer of `tailwind.config.js` correct is ingesteld:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```
En voeg **Tailwind-directives** toe aan `globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 2. Problemen met ShadCN oplossen
Als je ShadCN UI-componenten mist, installeer ze opnieuw:
```sh
npx shadcn@latest add input button card
```

---

## 💡 Veelvoorkomende problemen & oplossingen

🔹 **Probleem: `next` is not recognized as a command**
👉 Oplossing:
```sh
npm install next react react-dom
```

🔹 **Probleem: `tailwindcss init -p` werkt niet**
👉 Oplossing:
```sh
npx tailwindcss init -p
```

🔹 **Probleem: `node_modules` problemen bij installatie**
👉 Oplossing:
```sh
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 Samenvatting: Hoe start je het project opnieuw?
1️⃣ **Clone of update het project**
```sh
git clone https://github.com/Michelijo/boodschappenchecker.git
cd boodschappenchecker
git pull origin main
```

2️⃣ **Backend starten**
```sh
cd backend
npm install
node server.js
```

3️⃣ **Frontend starten**
```sh
cd ../boodschappen-frontend
npm install
npm run dev
```

✅ **Ga naar [`http://localhost:3000/`](http://localhost:3000/) om de app te bekijken.**

---

💡 **Hulp nodig? Stuur een bericht! 🚀**

