import React, { Component } from 'react';
import { Button, View, Text } from 'react-native';

class DetailsScreen extends Component {
  static navigationOptions = {
    title: 'Dashboard',
  };

  render() {
    console.log("Loading " + this.props.screenProps.name);
    this.props.screenProps.setName("Details")
    JSXToReturn = 
    <View id="mainView" style={{ flex: 1, flexDirection: "column", alignItems: 'flex-start', justifyContent: 'flex-start', padding:15, backgroundColor:"#404144"}}>
      <View style={{alignSelf:"stretch", backgroundColor:"#82b74b", height: 21}}>
        <Text style={{fontSize: 16, color:"#FFFFFF", paddingLeft:5, paddingRight:5, alignSelf:"flex-start", backgroundColor:"#000000"}}>Minecraft Server</Text>
      </View>
      <View style={{flexDirection: "row", alignSelf:"stretch", justifyContent:'space-around', padding:10}}>
        <Button
          title="Hello"
          onPress={() => this.props.navigation.push('Details')} 
          color="#FF0000"
          style={{flex:1}}
        />
        <Button
          title="Go to Home"
          onPress={() => this.props.navigation.navigate('Home')}
          style={{flex:1}}
        />
        <Button
          title="Go back"
          style={{flex:1}}
          onPress={() => this.props.navigation.goBack()}
        />
      </View>
    </View>;
    return (
      JSXToReturn
    );
  }
}

export default DetailsScreen;