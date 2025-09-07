import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Colors from '../constants/Colors';
import { getFeeds, addContent } from '../db/db';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';


export default function FeedScreen() {
  const [feeds, setFeeds] = useState([]);
  const navigation = useNavigation();
  useEffect(() => {
    (async () => {
      try {
        const data = await getFeeds();
        setFeeds(data);
        console.log(data);
      } catch (e) {
        console.log('Chyba při načítání feedů', e);
      }
    })();
  }, []);

  const onPress = (item) => {
    console.log("Pressed", item.title);
    item.id && addContent(item.id);
    // navigace na content screen
    navigation.navigate('ContentScreen', { 
      id: item.id,
      title: item.title,
      description: item.description 
    });
  }
  
  //entita feedu
  const renderFeed = ({ item }) => (
    <TouchableOpacity style={styles.feedItem} onPress={() => onPress(item)}>
      <Text style={styles.feedTitle}>{item.title}</Text>
      <Text style={styles.feedDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RSS Feedy</Text>
      <FlatList
        data={feeds}
        renderItem={renderFeed}
        keyExtractor={item => String(item.id)}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginVertical: 20,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  feedItem: {
    backgroundColor: Colors.background,
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 5,
  },
  feedDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
