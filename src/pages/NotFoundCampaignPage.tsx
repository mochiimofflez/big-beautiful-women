import { Link } from 'react-router-dom';

export function NotFoundCampaignPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-charcoal text-stone p-10">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-amber-200">Campaign Not Found</h1>
        <p className="text-stone/70">The campaign archive you are looking for does not exist.</p>
        <Link to="/" className="inline-block bg-brass text-charcoal px-6 py-3 rounded-2xl font-bold">Return to Library</Link>
      </div>
    </div>
  );
}
