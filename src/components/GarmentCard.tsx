'use client';

import { Check } from 'lucide-react';
import type { WardrobeItem } from '@/lib/types';

interface Props {
  item: WardrobeItem;
  selected?: boolean;
  isAffiliate?: boolean;
  onClick?: () => void;
}


export default function GarmentCard({ item, selected, isAffiliate, onClick }: Props) {
  const a = item.analysis;
  const seasonIcon: Record<string, string> = {
    spring: '🌸',
    summer: '☀️',
    autumn: '🍂',
    winter: '❄️',
    all: '🌡️',
  };

  return (
    <button
      onClick={onClick}
      className={`
        card aspect-[2/3] relative transition-all active:scale-95 w-full
        ${selected ? 'ring-2 ring-primary ring-offset-1' : ''}
      `}
    >
      {/* Image */}
      {item.file_path ? (
        <img
          src={item.file_path}
          alt={a?.type || ''}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-border text-2xl text-dim/40">
          👕
        </div>
      )}

      {/* Label overlay */}
      <div
        className="absolute bottom-0 inset-x-0 px-2 py-1.5"
        style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.55))' }}
      >
        <p className="text-white text-[10px] font-semibold capitalize truncate">
          {a?.type || 'Vêtement'}
        </p>
      </div>

      {/* Selected check */}
      {selected && (
        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <Check size={12} className="text-white" strokeWidth={3} />
        </div>
      )}

      {/* Affiliate badge */}
      {isAffiliate && (
        <div className="badge-affiliate">✦</div>
      )}

      {/* Season badge */}
      {a?.season && (
        <div className="absolute top-1.5 left-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-white/80 text-dim backdrop-blur-sm">
          {seasonIcon[a.season] ?? '🌡️'}
        </div>
      )}
    </button>
  );
}
