import React from 'react';

// Minimal `react-native` stand-in: host elements named after the component so
// react-test-renderer trees are easy to query. Type-only imports (e.g.
// NativeSyntheticEvent) are erased by babel, so no runtime stub is needed.
const host =
  (name: string) =>
  ({ children, ...props }: any) =>
    React.createElement(name, props, children);

export const View = host('View');
export const Text = host('Text');
export const Image = host('Image');
export const TouchableOpacity = host('TouchableOpacity');
export const StyleSheet = { create: (styles: any) => styles };
