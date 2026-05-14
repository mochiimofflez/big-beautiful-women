import Draggable from 'react-draggable';
import { ArticleBlock } from '../types';
type CollageArticleProps = {
  blocks: ArticleBlock[];
  onUpdatePosition?: (index: number, x: number, y: number) => void;
  onAddBlock?: (block: ArticleBlock) => void;
  mode?: 'edit' | 'view';
};

export function CollageArticle({ blocks, onUpdatePosition, onAddBlock, mode = 'view' }: CollageArticleProps) {
  const isEdit = mode === 'edit';

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isEdit || !onAddBlock) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        const newBlock: ArticleBlock = {
            title: 'New Media',
            content: '',
            imageUrl: URL.createObjectURL(file),
            position: { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }
        };
        onAddBlock(newBlock);
    }
  };

  return (
    <div 
        className="relative h-[800px] w-full overflow-hidden bg-charcoal/50 rounded-3xl border border-brass/10"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
    >
      {blocks.map((block, i) => (
// ...

        <Draggable
          key={i}
          defaultPosition={block.position || { x: 0, y: 0 }}
          onStop={(_, data) => onUpdatePosition && onUpdatePosition(i, data.x, data.y)}
          bounds="parent"
          disabled={!isEdit}
        >
          <div className={`absolute w-64 ${isEdit ? 'cursor-move' : 'cursor-default'} rounded-2xl border border-brass/20 p-4 shadow-xl ${block.title.toLowerCase().includes('parchment') ? 'parchment' : 'bg-[#111]'}`}>
            <h3 className="text-sm font-semibold mb-2">{block.title || 'Untitled'}</h3>
            <p className="text-xs">{block.content}</p>
            {block.imageUrl && (
              <img src={block.imageUrl} alt={block.title} className="mt-3 w-full rounded-lg" />
            )}
          </div>
        </Draggable>
      ))}
    </div>
  );
}
