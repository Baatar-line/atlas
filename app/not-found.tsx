'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Replaces the old react-router catch-all: <Route path="*" element={<Navigate to="/" replace/>}/>
// A client-side redirect (router.replace in an effect) rather than calling
// next/navigation's redirect() during the server render — that throws
// Next's internal NEXT_REDIRECT signal mid-render, which in dev (Turbopack)
// aborted this component's render span before its matching performance
// mark closed, surfacing as "Failed to execute 'measure' on 'Performance':
// 'NotFound' cannot have a negative time stamp." The redirect itself worked
// either way; this avoids tripping that instrumentation altogether.
export default function NotFound() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return null;
}
