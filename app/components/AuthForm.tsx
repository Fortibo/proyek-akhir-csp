// /components/AuthForm.tsx
'use client';
import React, { useState } from 'react';

type Props = {
  mode: 'signup' | 'signin';
  onSubmit: (payload: Record<string, any>) => Promise<void>;
};

export default function AuthForm({ mode, onSubmit }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [houseId, setHouseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'signup') {
        await onSubmit({ email, password, name: name || undefined, house_id: houseId || undefined });
      } else {
        await onSubmit({ email, password });
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full"
        />
      </div>

      {mode === 'signup' && (
        <>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full" />
          </div>

          <div>
            <label className="block text-sm font-medium">House ID (optional)</label>
            <input value={houseId} onChange={(e) => setHouseId(e.target.value)} className="mt-1 block w-full" />
          </div>
        </>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? 'Please wait...' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
        </button>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}
    </form>
  );
}
