import { Button, Text, View } from 'react-native';
import React, { useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import { useDispatch } from 'react-redux';
import { login } from 'hooks/authSlice';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { jwtDecode } from "jwt-decode";  



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
      scopes: ["openid", "profile", "email"],
    },
    {
      authorizationEndpoint: "https://sso.grupotapajos.com.br/loginss",
    }
  );

  useEffect(() => {
    if (response) {
    
      if (response.type === "error") {
        const url = response.url;
        const token:any = url.split('/').pop(); 
        const decodedToken: any =  jwtDecode(token);

        if (decodedToken) {
          console.log('Token recebido:', token);
          try {
            
            console.log('Token decodificado:', decodedToken);
            console.log('Usuário logado com sucesso:', decodedToken.email);
 
            dispatch(
              login({
                token,
                name: decodedToken.nome,
                email: decodedToken.email,
                profilePicture: decodedToken.foto_perfil_url,
              })
            );
            router.replace('/(tabs)');  
          } catch (error) {
            console.error('Erro ao processar o token:', error);
          }
        } else {
          console.log('Token não encontrado na resposta.');
        }
      } else if (response.type === "success") {
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