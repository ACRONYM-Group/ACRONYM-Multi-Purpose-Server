import React, { Component } from 'react';
import { Button, View, Text } from 'react-native';

function goToDetails(screenName) {
  console.log("Leaving " + screenName);
  
}

class HomeScreen extends Component {
  static navigationOptions = {
    title: 'Home',
  };
  render() {
    let buttonName = "Details";
    let name = this.props.screenProps.name;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor:"#404144" }}>
        <Text style={{fontSize: 56, color:"#FFFFFF"}}>{name}</Text>
        <Button
          title={buttonName}
          onPress={() => {
            goToDetails(this.props.screenProps.name);
            this.props.navigation.navigate('Details');
          }}
        />
      </View>
    );
  }
}

export default HomeScreen;