type MediaProps = {
  type: 'youtube' | 'audio';
  url: string;
};

export function MediaBox({ type, url }: MediaProps) {
  return (
    <div className="w-full h-full p-2">
      {type === 'youtube' ? (
        <iframe className="w-full h-full" src={url.replace('watch?v=', 'embed/')} frameBorder="0" allowFullScreen />
      ) : (
        <audio controls className="w-full">
          <source src={url} type="audio/mpeg" />
        </audio>
      )}
    </div>
  );
}
