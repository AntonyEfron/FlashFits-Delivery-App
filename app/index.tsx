import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { Text } from 'react-native'; 
// import * as SecureStore from 'expo-secure-store';
// import Loader from '@/components/Loader/Loader';
// import { initSocket } from './config/socket';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  return <Redirect href={isAuthenticated ? '/(home)' : '/(auth)'} />;
}
