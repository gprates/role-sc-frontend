import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  RecuperarSenha: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  DetalheEvento: { id: string };
};

export type FavoritosStackParamList = {
  FavoritosList: undefined;
  DetalheEvento: { id: string };
};

export type PerfilStackParamList = {
  PerfilHome: undefined;
  EditarPerfil: undefined;
  AlterarSenha: undefined;
};

export type AppTabsParamList = {
  EventosTab: undefined;
  FavoritosTab: undefined;
  PerfilTab: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, T>,
    BottomTabScreenProps<AppTabsParamList>
  >;

export type FavoritosStackScreenProps<T extends keyof FavoritosStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<FavoritosStackParamList, T>,
    BottomTabScreenProps<AppTabsParamList>
  >;

export type PerfilStackScreenProps<T extends keyof PerfilStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<PerfilStackParamList, T>,
    BottomTabScreenProps<AppTabsParamList>
  >;
