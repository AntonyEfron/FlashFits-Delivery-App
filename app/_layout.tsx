import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}> 
        <Stack
          screenOptions={{
            headerShown: false, // hide default headers
          }}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
