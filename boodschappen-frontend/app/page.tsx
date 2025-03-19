"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Supermarkt logo's
const supermarketLogos: { [key: string]: string } = {
  AlbertHeijn: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Albert_Heijn_Logo.svg",
  Jumbo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Jumbo_Logo.svg/2560px-Jumbo_Logo.svg.png"
};

export default function Home() {
  const [product, setProduct] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPrices = async () => {
    if (!product) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/compare/${product}`);
      const result = await response.json();
      setData(result);
      console.log("🔹 Data ontvangen:", result);
    } catch (error) {
      console.error("Fout bij ophalen van data:", error);
    }
    setLoading(false);
  };

  // Bepaal de goedkoopste supermarkt
  const cheapestStore = data
    ? Object.entries(data).reduce((cheapest, [store, details]) => {
        if (!cheapest || (details.price && details.price < cheapest.price)) {
          return { store, price: details.price };
        }
        return cheapest;
      }, null)
    : null;

  return (  
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-4">Boodschappen Prijschecker</h1>
      <div className="flex gap-2 w-full max-w-md">
        <Input
          type="text"
          placeholder="Voer een productnaam in..."
          value={product}
          onChange={(e) => setProduct(e.target.value)}
        />
        <Button onClick={fetchPrices} disabled={loading}>Zoek nu!</Button>
      </div>
      
      {loading && <p className="mt-4 text-blue-500">Laden...</p>}

      {data && Object.entries(data).map(([supermarkt, details]) => (
        <div key={supermarkt} className="relative w-full max-w-md mt-6">
          {/* Groene label alleen bij de goedkoopste supermarkt */}
          {cheapestStore?.store === supermarkt && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-sm font-semibold px-4 py-1 rounded-full shadow-md">
              De goedkoopste optie!
            </div>
          )}

          <Card className="shadow-lg border border-gray-300 rounded-lg">
            <CardContent className="p-4 flex flex-col items-center">
              {/* Supermarkt Logo */}
              <img 
                src={supermarketLogos[supermarkt] || "https://via.placeholder.com/50"} 
                alt={`${supermarkt} logo`} 
                className="h-12 w-auto mb-2"
              />
              <h2 className="text-xl font-semibold">{supermarkt}</h2>
              {details.imageUrl && (
                <img src={details.imageUrl} alt={details.product} className="w-48 h-48 object-cover rounded-xl mt-2" />
              )}
              <p className="text-lg">Prijs: <span className="font-bold">€{details.price}</span></p>
              <p className="text-sm text-gray-600">Prijs per kilo: {details.pricePerKilo ? `€${details.pricePerKilo}` : "Niet beschikbaar"}</p>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
