import React, { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface InputProps extends Omit<TextInputProps, 'style'> {
  icon?: IconName;
  isPassword?: boolean;
}

/**
 * Campo de input padronizado com ícone à esquerda (opcional) e toggle de senha.
 * Usado em todos os formulários (login, cadastro, etc.).
 */
export const Input = forwardRef<TextInput, InputProps>(
  ({ icon, isPassword = false, ...textInputProps }, ref) => {
    const [hidden, setHidden] = useState(isPassword);
    const [focused, setFocused] = useState(false);

    return (
      <View style={[styles.container, focused && styles.containerFocused]}>
        {icon ? (
          <Ionicons
            name={icon}
            size={20}
            color={focused ? colors.primary : colors.textMuted}
            style={styles.iconLeft}
          />
        ) : null}
        <TextInput
          ref={ref}
          {...textInputProps}
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword ? hidden : textInputProps.secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            textInputProps.onBlur?.(e);
          }}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((prev) => !prev)}
            hitSlop={10}
            style={styles.iconRight}
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerFocused: {
    borderColor: colors.primary,
  },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm, padding: 4 },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
});
