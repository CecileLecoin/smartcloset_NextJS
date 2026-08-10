'use client';

import { WeatherInfo } from '@/lib/types';
import { useEffect, useState } from 'react';

interface WeatherData {
  temp: number;
  city: string;
  tag: 'hot' | 'warm' | 'cold' | 'rain' | 'snow';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}


export default function WeatherBar({
  onFilterByWeather,
  onWeatherChange,
}: {
  onFilterByWeather?: (tag: string) => void;
  onWeatherChange?: (weather: WeatherInfo) => void;
}) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    ///////Fallback saisons
    function inferSeasonFromDate(): "spring" | "summer" | "autumn" | "winter" {
      const m = new Date().getMonth();
      if (m >= 2 && m <= 4) return "spring";
      if (m >= 5 && m <= 7) return "summer";
      if (m >= 8 && m <= 10) return "autumn";
      return "winter";
    }


  useEffect(() => {
    let cancelled = false;

    async function fetchAndApplyWeather(url: string): Promise<boolean> {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Weather API error ${res.status}`);
        const data: WeatherData = await res.json();
        if (cancelled) return true;

        setWeather(data);
        onWeatherChange?.({
          tag: data.tag,
          season: data.season ?? inferSeasonFromDate(),
          temperature: data.temp,
        });
        return true;
      } catch {
        return false;
      }
    }

    async function loadWeather() {
      setLoading(true);

      const fetchParisWeather = async () => {
        const ok = await fetchAndApplyWeather('/api/weather');
        if (!ok && !cancelled) setWeather(null);
      };

      if (!navigator.geolocation) {
        await fetchParisWeather();
        if (!cancelled) setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async position => {
          const { latitude, longitude } = position.coords;
          const ok = await fetchAndApplyWeather(
            `/api/weather?lat=${latitude}&lon=${longitude}`
          );

          if (!ok) {
            await fetchParisWeather();
          }

          if (!cancelled) setLoading(false);
        },
        async () => {
          await fetchParisWeather();
          if (!cancelled) setLoading(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 300000,
        }
      );
    }

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, [onWeatherChange]);

    if (loading) {
    return (
      <div className="text-xs text-dim px-5 py-3">
        🌦️ Chargement de la météo en cours...
      </div>
    );
  }
  if (!weather && !loading) {
    return (
      <div className="text-xs text-dim px-5 py-3">
        🌦️ Météo indisponible – affichage par défaut
      </div>
    );
  }
  
      



  return (
    <div
      onClick={() => {
        onFilterByWeather?.(weather!.tag);
        
        onWeatherChange?.(weather!);
      }}
      className="mx-5 mb-2 p-3 rounded-xl flex items-center gap-3 cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, #E8F4FD, #F0E8FF)',
        border: '1px solid rgba(124,92,252,0.1)',
      }}
    >
      <div>
        <p className="font-bold text-sm">
          {weather!.temp}° — {weather!.city}
        </p>
        <p className="text-xs text-dim">
          Conditions actuelles
        </p>
      </div>

      <span className="ml-auto text-xs font-semibold">
        {weather!.tag}
      </span>
    </div>
  );
}
