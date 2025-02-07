import { Button, Text, View } from 'react-native';
import React, { useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import { useDispatch } from 'react-redux';
import { login } from 'hooks/authSlice';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import jwt_decode from 'jwt-decode';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const navigation: any = useNavigation();
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'tapajoscollector',
    path: 'auth',
  });

  const router = useRouter();
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: "4ca15e42-c2a0-41df-81cd-58f485551533",
      redirectUri: redirectUri,
      scopes: ["openid", "profile", "email" ],
    },
    {
      authorizationEndpoint: "https://sso.grupotapajos.com.br/loginss",
    }
  );
  function decodeJWT(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Erro ao decodificar JWT:', error);
      return null;
    }
  }
  
  // Uso:
  
  useEffect(() => {
    if (response) {
      console.log('Response:', response);

      if (response) {
        // Extrai o token da URL
        const token = response?.error.url

        if (token) {
          console.log('Token recebido:', token);
          try {
            const decodedToken = decodeJWT(token);
            // Supondo que o token decodificado contenha os campos: nome, email e foto_perfil_url
            dispatch(
              login({
                token,
                name: decodedToken.nome,
                email: decodedToken.email,
                profilePicture: decodedToken.foto_perfil_url,
              })
            );
            router.replace('/(tabs)'); // Redireciona para a tela inicial
          } catch (error) {
            console.error('Erro ao decodificar o token:', error);
          }
        } else {
          console.log('Token não encontrado na resposta.');
        }
      } else if (response.type === "error") {
        console.log('Erro na autenticação:', response.error);
      }
    }
  }, [response]);

  const handleLogin = async () => {
    await promptAsync();
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Bem-vindo ao app!</Text>
      <Button title="Entrar com SSO" onPress={handleLogin} />
    </View>
  );
}