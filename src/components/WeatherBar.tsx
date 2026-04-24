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
    const [season, setSeason] = useState<string | null>(null);

    ///////Fallback saisons
    function inferSeasonFromDate(): "spring" | "summer" | "autumn" | "winter" {
      const m = new Date().getMonth();
      if (m >= 2 && m <= 4) return "spring";
      if (m >= 5 && m <= 7) return "summer";
      if (m >= 8 && m <= 10) return "autumn";
      return "winter";
    }


  useEffect(() => {
    fetch('/api/weather')
      .then(res => res.json())
      .then(data => {
        setWeather(data);

        onWeatherChange?.({
          tag: data.tag,
          season: data.season ?? inferSeasonFromDate(),
          temperature: data.temp,
        });

        onFilterByWeather?.(data.tag);
      })
      .catch(console.error);
  }, []);

  if (!weather) return null;
  
      



  return (
    <div
      onClick={() => {
        onFilterByWeather?.(weather.tag);
        
        onWeatherChange?.(weather);
      }}
      className="mx-5 mb-2 p-3 rounded-xl flex items-center gap-3 cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, #E8F4FD, #F0E8FF)',
        border: '1px solid rgba(124,92,252,0.1)',
      }}
    >
      <div>
        <p className="font-bold text-sm">
          {weather.temp}° — {weather.city}
        </p>
        <p className="text-xs text-dim">
          Conditions actuelles
        </p>
      </div>

      <span className="ml-auto text-xs font-semibold">
        {weather.tag}
      </span>
    </div>
  );
}


/*'use client';

import { CloudSun, Cloud, Sun, CloudRain, Snowflake, CloudLightning } from 'lucide-react';

interface WeatherData {
  temp: number;
  city: string;
  description: string;
  tag: string;
  icon: 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'snow' | 'storm';
}

// Placeholder — will be replaced by real API call
const MOCK_WEATHER: WeatherData = {
  temp: 16,
  city: 'Paris',
  description: 'Quelques nuages, pas de pluie',
  tag: 'Mi-saison',
  icon: 'cloud-sun',
};

const ICONS = {
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  rain: CloudRain,
  snow: Snowflake,
  storm: CloudLightning,
};

interface Props {
  onFilterByWeather?: (tag: string) => void;
}

export default function WeatherBar({ onFilterByWeather }: Props) {
  const w = MOCK_WEATHER;
  const Icon = ICONS[w.icon] || CloudSun;

  return (
    <button
      onClick={() => onFilterByWeather?.(w.tag)}
      className="mx-5 mb-2 p-3 rounded-xl flex items-center gap-3 transition-all active:scale-[0.98]"
      style={{
        background: 'linear-gradient(135deg, #E8F4FD, #F0E8FF)',
        border: '1px solid rgba(124,92,252,0.1)',
      }}
    >
      <Icon size={28} className="text-secondary flex-shrink-0" />
      <div className="flex-1 text-left">
        <p className="text-sm font-bold text-dark">
          {w.temp}° — {w.city}
        </p>
        <p className="text-[10px] text-dim">{w.description}</p>
      </div>
      <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-secondary/10 text-secondary flex-shrink-0">
        {w.tag}
      </span>
    </button>
  );
}*/
