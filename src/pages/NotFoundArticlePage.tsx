import { Link, useParams } from 'react-router-dom';

export function NotFoundArticlePage() {
  const { campaignId } = useParams();
  return (
    <div className="flex h-screen items-center justify-center bg-charcoal text-stone p-10">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-amber-200">Article Not Found</h1>
        <p className="text-stone/70">The requested article could not be located in this archive.</p>
        <div className="flex gap-4 justify-center">
            <Link to={`/Campaigns/${campaignId}`} className="bg-brass/20 text-brass px-6 py-3 rounded-2xl">Return to Campaign</Link>
            <Link to="/" className="bg-brass text-charcoal px-6 py-3 rounded-2xl font-bold">Return to Home</Link>
        </div>
      </div>
    </div>
  );
}
