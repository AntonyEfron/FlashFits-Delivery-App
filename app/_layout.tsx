import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from "expo-secure-store";
import {emitter} from '../config/socketConfig'
import { useEffect } from "react";

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
