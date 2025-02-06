// ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { useRouter, useSegments } from 'expo-router';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();
  const segments:any = useSegments();

  useEffect(() => {
    // Se os segmentos ainda não estiverem prontos, não tenta navegar
    if (segments.length === 0) return;

    // Se o usuário não estiver logado e não estiver na tela de login, redireciona com um pequeno delay
    if (!user && segments[0] !== 'login') {
      setTimeout(() => {
        router.replace('/login');
      }, 0);
    }
  }, [user, segments]);

  // Enquanto o usuário não estiver definido, retorne null (ou um loader, se preferir)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
