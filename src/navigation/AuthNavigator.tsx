import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '@/screens/auth/LoginScreen';
import { CadastroScreen } from '@/screens/auth/CadastroScreen';
import { RecuperarSenhaScreen } from '@/screens/auth/RecuperarSenhaScreen';
import { VerificarEmailScreen } from '@/screens/auth/VerificarEmailScreen';

import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Cadastro" component={CadastroScreen} />
      <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
      <Stack.Screen name="VerificarEmail" component={VerificarEmailScreen} />
    </Stack.Navigator>
  );
};
