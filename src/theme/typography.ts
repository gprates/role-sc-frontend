import { TextStyle } from 'react-native';

export const typography = {
  display: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  } satisfies TextStyle,
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  } satisfies TextStyle,
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  } satisfies TextStyle,
  bodyBold: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  } satisfies TextStyle,
  captionBold: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  } satisfies TextStyle,
  micro: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 0.6,
  } satisfies TextStyle,
};
