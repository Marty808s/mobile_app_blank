import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import TabNavigator from './src/navigation/TabNavigator';
import { fetchRSSChannel } from './src/api/FetchRSS';
import { useEffect } from 'react';
import { initDB, addContent } from './src/db/db';
import { UpdateService } from './src/services/UpdateService';

export default function App() {
  // na této stránce bude proběhne aktualizace jednotlivých zpráv na dostupných feedech
  // testovací funkce - zatím init
  useEffect(() => {
    const initFetch = async() => {
      //const res = await fetchRSSChannel("https://servis.idnes.cz/rss.aspx?c=prahah")
      await initDB();
      //await addContent('1');
      UpdateService();
    }
    initFetch();
  }, []);

  return (
    <NavigationContainer>
      <TabNavigator />
      <StatusBar style="light" />
    </NavigationContainer>
  );
}
