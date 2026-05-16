import { useState } from 'react';
import Draggable from 'react-draggable';
import type { ArticleData } from '../types';

type Marker = {
  id: string;
  articleId: string;
  x: number;
  y: number;
};

type MapViewProps = {
  campaignMapUrl?: string;
  articles: ArticleData[];
  onSelectArticle: (id: string) => void;
};

export function MapView({ campaignMapUrl, articles, onSelectArticle }: MapViewProps) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [isAddingMarker, setIsAddingMarker] = useState(false);

  const handleMapClick = (e: React.MouseEvent) => {
    if (!isAddingMarker) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const articleId = window.prompt('Enter Article Slug/ID to link:');
    if (articleId) {
        setMarkers([...markers, { id: Date.now().toString(), articleId, x, y }]);
    }
    setIsAddingMarker(false);
  };

  return (
    <div className='relative w-full h-full bg-[#0a0a0a] rounded-3xl overflow-hidden border border-brass/10'>
      {!campaignMapUrl ? (
          <div className='h-full flex flex-col items-center justify-center space-y-4 text-stone/40'>
              <div className='text-4xl'>🗺️</div>
              <p className='text-sm italic'>No campaign map detected in archival records.</p>
              <button className='px-4 py-2 border border-brass/20 rounded-lg text-xs hover:bg-brass/5 transition-colors'>Upload Strategic Schematic</button>
          </div>
      ) : (
          <div className='relative w-full h-full cursor-crosshair' onClick={handleMapClick}>
              <img src={campaignMapUrl} alt='Campaign Map' className='w-full h-full object-contain pointer-events-none opacity-60' />
              
              {markers.map(marker => (
                  <div 
                    key={marker.id}
                    onClick={(e) => { e.stopPropagation(); onSelectArticle(marker.articleId); }}
                    className='absolute w-6 h-6 -ml-3 -mt-3 bg-brass/20 border border-brass rounded-full shadow-lg cursor-pointer hover:scale-125 transition-transform flex items-center justify-center group'
                    style={{ left: marker.x, top: marker.y }}
                  >
                      <div className='w-2 h-2 bg-brass rounded-full animate-pulse' />
                      <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#111] border border-brass/20 rounded text-[9px] text-amber-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                        {articles.find(a => a.id === marker.articleId)?.title || marker.articleId}
                      </div>
                  </div>
              ))}

              <div className='absolute top-6 left-6 flex gap-2'>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsAddingMarker(!isAddingMarker); }}
                    className={`px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold border transition-all ${isAddingMarker ? 'bg-amber-500 text-charcoal border-amber-500' : 'bg-[#111]/80 backdrop-blur-md border-brass/20 text-brass hover:border-brass'}`}
                  >
                      {isAddingMarker ? 'Click Map to Place Marker' : '+ Add Map Marker'}
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}
