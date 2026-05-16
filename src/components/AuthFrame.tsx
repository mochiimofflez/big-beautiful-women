interface AuthFrameProps {
  show: boolean;
  mode: 'signin' | 'signup';
  handleOrEmail: string;
  email: string;
  password: string;
  inviteInput: string;
  authMessage: string;
  successMessage?: string;
  onClose: () => void;
  onToggleMode: () => void;
  onHandleOrEmailChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onInviteInputChange: (value: string) => void;
  onSubmit: () => void;
}

export function AuthFrame({
  show,
  mode,
  handleOrEmail,
  email,
  password,
  inviteInput,
  authMessage,
  successMessage,
  onClose,
  onToggleMode,
  onHandleOrEmailChange,
  onEmailChange,
  onPasswordChange,
  onInviteInputChange,
  onSubmit,
}: AuthFrameProps) {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4"
      onKeyDown={(e) => {
        if (e.key === 'Escape') e.preventDefault();
      }}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-md rounded-[32px] border border-brass/15 bg-[#0d0b0b] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-brass/70">
              {mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </div>
            <p className="mt-2 text-sm text-stone/70">
              {mode === 'signin'
                ? 'Enter your archive handle or email and secret phrase.'
                : 'Create a new reader record with a valid access key.'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {mode === 'signin' ? (
            <input
              value={handleOrEmail}
              onChange={(event) => onHandleOrEmailChange(event.target.value)}
              placeholder="Handle or Email"
              className="w-full rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-sm text-stone outline-none focus:border-amber-400"
            />
          ) : (
            <input
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="Email Address"
              className="w-full rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-sm text-stone outline-none focus:border-amber-400"
            />
          {mode === 'signup' && (
            <input
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="Email Address"
              className="w-full rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-sm text-stone outline-none focus:border-amber-400"
            />
          )}
          {mode === 'signup' && (
            <input
              value={inviteInput}
              onChange={(event) => onInviteInputChange(event.target.value)}
              placeholder="Username"
              className="w-full rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-sm text-stone outline-none focus:border-amber-400"
            />
          )}
          {mode === 'signup' && (
            <input
              value={inviteInput}
              onChange={(event) => onInviteInputChange(event.target.value)}
              placeholder="Access Key"
              className="w-full rounded-2xl border border-brass/20 bg-[#0f0d0d] px-4 py-3 text-sm text-stone outline-none focus:border-amber-400"
            />
          )}
          {authMessage && <p className="text-[11px] text-red-400">{authMessage}</p>}
          {successMessage && <p className="text-[11px] text-emerald-400">{successMessage}</p>}
          <button
            type="button"
            onClick={onSubmit}
            className="w-full rounded-2xl bg-brass px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-charcoal transition hover:bg-amber-300"
          >
            {mode === 'signin' ? 'Enter Archive' : 'Establish Record'}
          </button>
          <button
            type="button"
            onClick={onToggleMode}
            className="w-full rounded-2xl border border-brass/20 bg-transparent px-4 py-3 text-xs uppercase tracking-[0.25em] text-stone/70 transition hover:bg-brass/10"
          >
            Switch to {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
