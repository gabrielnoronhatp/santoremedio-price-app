import { Button, Text, View } from 'react-native';
import React, { useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import { useDispatch } from 'react-redux';
import { login } from '../hooks/authSlice'; 
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const navigation: any = useNavigation();
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'tapajoscollector', 
    path: 'auth', 
  });

  console.log("Redirect URI:", redirectUri); 

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
    if (response?.type === "success") {
      const token = response.authentication?.accessToken;
      if (token) {
        dispatch(login({ token, name: "Usuário SSO" }));
        navigation.navigate('(tabs)'); 
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