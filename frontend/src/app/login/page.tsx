'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      router.replace('/');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:4000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const { token } = await res.json();
      localStorage.setItem('token', token); // Use localStorage instead of cookie
      console.log('LoginPage: token set =', token); // Debug log
      console.log('LoginPage: localStorage token =', localStorage.getItem('token'));
      router.push('/');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-[#41015F] to-gray-900">
      <form onSubmit={handleLogin} className="bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-[#31dFC5]/30">
        <h1 className="text-2xl font-bold mb-4 text-white">Login</h1>
        <input
          type="email"
          placeholder="Email address"
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
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button type="submit" className="w-full bg-[#01AAC7] text-white py-2 rounded mb-2 hover:bg-[#31dFC5] transition-colors">Login</button>
        <div className="text-center text-sm text-gray-300">
          Don&apos;t have an account?{` `}
          <Link href="/signup" className="text-[#31dFC5] underline hover:text-[#01AAC7]">Sign Up</Link>
        </div>
      </form>
    </div>
  );
}
