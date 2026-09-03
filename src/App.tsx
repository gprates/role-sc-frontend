import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/ScreenBackground';
import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritosProvider } from '@/contexts/FavoritosContext';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <ScreenBackground>
            <StatusBar style="dark" />
            <AuthProvider>
              <FavoritosProvider>
                <RootNavigator />
              </FavoritosProvider>
            </AuthProvider>
          </ScreenBackground>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
