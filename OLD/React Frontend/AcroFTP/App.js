var bigInt = require("big-integer");
import openSocket from 'socket.io-client';
var client;

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createStackNavigator } from 'react-navigation';
import HomeScreen from './components/HomeScreen';
import DetailsScreen from './components/DetailsScreen';
let propsForAll = "Dashboard";

const RootStack = createStackNavigator(
  {
    Home: HomeScreen,
    Details: DetailsScreen,
  },
  {
    initialRouteName: 'Home',
    navigationOptions: {
      headerStyle: {
        backgroundColor: '#82b74b',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    },
  },
);

export default class App extends React.Component {
  render() {
    function setName(newValue) {
      propsForAll.name = newValue;
    }
    let propsForAll = {name:"Login", setName:setName};
    return <RootStack screenProps={propsForAll}/>;
  }

  constructor(props) {
    super(props);
  
    // Creating the socket-client instance will automatically connect to the server.
    this.socket = openSocket('http://192.168.1.10:3000');
    client = this.socket;
    client.emit('AcroFTP', '{"clientType": "react"}');
    console.log("connecting");

    this.socket.on('AcroFTP', (message) => {
      console.log(message);
    });

    function sendMessage(channel, data) {
      client.emit(channel, data);
    }
  }
  
}