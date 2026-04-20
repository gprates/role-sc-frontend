import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeScreen } from '@/screens/eventos/HomeScreen';
import { DetalheEventoScreen } from '@/screens/eventos/DetalheEventoScreen';
import { FavoritosScreen } from '@/screens/favoritos/FavoritosScreen';
import { PerfilScreen } from '@/screens/perfil/PerfilScreen';
import { EditarPerfilScreen } from '@/screens/perfil/EditarPerfilScreen';
import { AlterarSenhaScreen } from '@/screens/perfil/AlterarSenhaScreen';
import { colors, radius, spacing, typography } from '@/theme';

import {
  AppTabsParamList,
  FavoritosStackParamList,
  HomeStackParamList,
  PerfilStackParamList,
} from './types';

type IconName = keyof typeof Ionicons.glyphMap;

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const FavoritosStack = createNativeStackNavigator<FavoritosStackParamList>();
const PerfilStack = createNativeStackNavigator<PerfilStackParamList>();
const Tabs = createBottomTabNavigator<AppTabsParamList>();

const stackScreenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: 'transparent' },
  animation: 'slide_from_right' as const,
};

const HomeStackNavigator: React.FC = () => (
  <HomeStack.Navigator screenOptions={stackScreenOptions}>
    <HomeStack.Screen name="Home" component={HomeScreen} />
    <HomeStack.Screen name="DetalheEvento" component={DetalheEventoScreen} />
  </HomeStack.Navigator>
);

const FavoritosStackNavigator: React.FC = () => (
  <FavoritosStack.Navigator screenOptions={stackScreenOptions}>
    <FavoritosStack.Screen name="FavoritosList" component={FavoritosScreen} />
    <FavoritosStack.Screen
      name="DetalheEvento"
      component={DetalheEventoScreen}
    />
  </FavoritosStack.Navigator>
);

const PerfilStackNavigator: React.FC = () => (
  <PerfilStack.Navigator screenOptions={stackScreenOptions}>
    <PerfilStack.Screen name="PerfilHome" component={PerfilScreen} />
    <PerfilStack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
    <PerfilStack.Screen name="AlterarSenha" component={AlterarSenhaScreen} />
  </PerfilStack.Navigator>
);

interface TabDef {
  name: keyof AppTabsParamList;
  label: string;
  icon: IconName;
}

const TABS: TabDef[] = [
  { name: 'EventosTab', label: 'Eventos', icon: 'calendar-outline' },
  { name: 'FavoritosTab', label: 'Favoritos', icon: 'heart-outline' },
  { name: 'PerfilTab', label: 'Perfil', icon: 'person-outline' },
];

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        tabStyles.container,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) },
      ]}
    >
      <View style={tabStyles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const def = TABS.find((t) => t.name === route.name);
          if (!def) return null;

          const { options } = descriptors[route.key];
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel={options.tabBarAccessibilityLabel ?? def.label}
              style={tabStyles.tab}
            >
              <View style={tabStyles.iconWrapper}>
                {isFocused ? (
                  <LinearGradient
                    colors={colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={tabStyles.iconActiveBg}
                  >
                    <Ionicons
                      name={def.icon}
                      size={22}
                      color={colors.textOnPrimary}
                    />
                  </LinearGradient>
                ) : (
                  <Ionicons name={def.icon} size={22} color={colors.textMuted} />
                )}
              </View>
              <Text
                style={[
                  tabStyles.label,
                  isFocused ? tabStyles.labelActive : tabStyles.labelInactive,
                ]}
              >
                {def.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <Tabs.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="EventosTab" component={HomeStackNavigator} />
      <Tabs.Screen name="FavoritosTab" component={FavoritosStackNavigator} />
      <Tabs.Screen name="PerfilTab" component={PerfilStackNavigator} />
    </Tabs.Navigator>
  );
};

const tabStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: 4,
  },
  iconWrapper: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  iconActiveBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
  labelActive: { color: colors.primary },
  labelInactive: { color: colors.textMuted },
});
