'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      router.replace('/');
    }
  }, [router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const res = await fetch('http://localhost:4000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      setSuccess('Sign up successful! Redirecting to login...');
      setTimeout(() => router.push('/login'), 1500);
    } else {
      setError('Sign up failed. Email may already be in use.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-[#41015F] to-gray-900">
      <form onSubmit={handleSignUp} className="bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-[#31dFC5]/30">
        <h1 className="text-2xl font-bold mb-4 text-white">Sign Up</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border border-[#31dFC5]/30 rounded px-3 py-2 w-full mb-4 bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#31dFC5]/50"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border border-[#31dFC5]/30 rounded px-3 py-2 w-full mb-4 bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#31dFC5]/50"
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="border border-[#31dFC5]/30 rounded px-3 py-2 w-full mb-4 bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#31dFC5]/50"
          required
        />
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {success && <div className="text-green-500 mb-2">{success}</div>}
        <button type="submit" className="w-full bg-[#01AAC7] text-white py-2 rounded hover:bg-[#31dFC5] transition-colors">Sign Up</button>
        <p className="mt-4 text-center text-sm text-gray-300">
          Already have an account?{' '}
          <Link href="/login" className="text-[#31dFC5] hover:text-[#01AAC7] hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
