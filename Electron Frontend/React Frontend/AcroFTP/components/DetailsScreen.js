import React, { Component } from 'react';
import { Button, View, Text } from 'react-native';

class DetailsScreen extends Component {
  static navigationOptions = {
    title: 'Details',
  };

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'flex-start', margin:15}}>
        <Text style={{fontSize: 56}}>Dashboard</Text>
        <Button
          title="Go to Details... again"
          onPress={() => this.props.navigation.push('Details')} 
          color="#FF0000"
        />
        <Button
          title="Go to Home"
          onPress={() => this.props.navigation.navigate('Home')}
        />
        <Button
          title="Go back"
          onPress={() => this.props.navigation.goBack()}
        />
      </View>
    );
  }
}

export default DetailsScreen;