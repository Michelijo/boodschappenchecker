"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    } catch (error) {
      console.error("Fout bij ophalen van data:", error);
    }
    setLoading(false);
  };

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
      
      {data && (
        <Card className="mt-6 w-full max-w-md">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold">{data.product}</h2>
            <p className="text-lg">Prijs: <span className="font-bold">€{data.price}</span></p>
            <p className="text-sm text-gray-600">Prijs per eenheid: {data.pricePerUnit}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
