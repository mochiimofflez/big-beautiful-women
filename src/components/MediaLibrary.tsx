import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type MediaAsset = {
    name: string;
    url: string;
    size: number;
    type: string;
};

type MediaLibraryProps = {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (url: string) => void;
};

export function MediaLibrary({ isOpen, onClose, onSelect }: MediaLibraryProps) {
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isOpen) fetchAssets();
    }, [isOpen]);

    const fetchAssets = async () => {
        setLoading(true);
        const { data, error } = await supabase.storage.from('media').list('');
        if (error) {
            console.error('Error fetching assets:', error);
        } else if (data) {
            const formatted = data.map(item => ({
                name: item.name,
                url: supabase.storage.from('media').getPublicUrl(item.name).data.publicUrl,
                size: item.metadata?.size || 0,
                type: item.metadata?.mimetype || ''
            }));
            setAssets(formatted);
        }
        setLoading(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('File exceeds 10MB limit.');
            return;
        }

        setUploading(true);
        const { error } = await supabase.storage.from('media').upload(`${Date.now()}-${file.name}`, file);
        if (error) {
            alert('Upload failed: ' + error.message);
        } else {
            fetchAssets();
        }
        setUploading(false);
    };

    const deleteAsset = async (name: string) => {
        if (window.confirm('Are you sure you want to delete this asset?')) {
            const { error } = await supabase.storage.from('media').remove([name]);
            if (error) alert('Delete failed');
            else fetchAssets();
        }
    };

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm'>
            <div className='bg-charcoal border border-brass/20 w-full max-w-4xl h-[80vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200'>
                <div className='p-6 border-b border-brass/10 flex justify-between items-center bg-[#0c0b0b]'>
                    <div>
                        <h2 className='text-xl font-display font-bold text-amber-100 uppercase tracking-widest'>Media Library</h2>
                        <p className='text-[10px] text-stone/40 uppercase tracking-[0.2em]'>Manage campaign assets (10MB limit)</p>
                    </div>
                    <div className='flex gap-4 items-center'>
                        <label className='bg-brass text-charcoal px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-amber-400 transition-all'>
                            {uploading ? 'Uploading...' : 'Upload New'}
                            <input type='file' onChange={handleUpload} className='hidden' />
                        </label>
                        <button onClick={onClose} className='text-brass hover:text-white transition-colors text-xl'>✕</button>
                    </div>
                </div>

                <div className='flex-1 overflow-y-auto p-6 no-scrollbar'>
                    {loading ? (
                        <div className='h-full flex items-center justify-center text-brass italic'>Scanning archives...</div>
                    ) : (
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                            {assets.map(asset => (
                                <div key={asset.name} className='group relative aspect-square bg-brass/5 rounded-2xl border border-brass/10 overflow-hidden hover:border-brass/30 transition-all'>
                                    {asset.type.startsWith('image/') ? (
                                        <img src={asset.url} alt={asset.name} className='w-full h-full object-cover' />
                                    ) : (
                                        <div className='w-full h-full flex flex-col items-center justify-center p-4 text-center'>
                                            <span className='text-2xl mb-2'>{asset.type.includes('audio') ? '🎵' : asset.type.includes('pdf') ? '📕' : '📄'}</span>
                                            <span className='text-[9px] text-stone/60 truncate w-full'>{asset.name}</span>
                                        </div>
                                    )}
                                    
                                    <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2'>
                                        <button 
                                            onClick={() => onSelect?.(asset.url)}
                                            className='bg-brass text-charcoal px-3 py-1.5 rounded-full text-[10px] font-bold uppercase'
                                        >
                                            Select
                                        </button>
                                        <button 
                                            onClick={() => deleteAsset(asset.name)}
                                            className='text-red-400 text-[10px] hover:text-red-300 underline'
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
