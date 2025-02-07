import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { useRouter, useSegments } from 'expo-router';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && segments.length > 0) {
      console.log('Segmentos da rota atual:', segments);

      const isLoginRoute = segments[0] === 'login';

      // Se o usuário não estiver logado e não estiver na tela de login, redirecione para o login
      if (!user && !isLoginRoute) {
        console.log('Usuário não logado. Redirecionando para /login.');
        router.replace('/login');
      }

      // Se o usuário estiver logado e estiver na tela de login, redirecione para a home
      if (user && isLoginRoute) {
        console.log('Usuário logado. Redirecionando para /(tabs).');
        router.replace('/(tabs)');
      }
    }
  }, [user, segments, isMounted, router]);

  if (!user) {
    console.log('Usuário não logado. Renderizando null.');
    return null; // Ou um componente de loading, se preferir
  }

  console.log('Usuário logado. Renderizando children.');
  return <>{children}</>;
}