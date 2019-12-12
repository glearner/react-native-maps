import React, { Component } from "react";
import {
  Text,
  StyleSheet,
  View,
  TouchableHighlight,
  Keyboard
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import Geolocation from "@react-native-community/geolocation";
import { TextInput } from "react-native-gesture-handler";
import PolyLine from "@mapbox/polyline";
import _ from "lodash";

import key from "./config/config";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      latitude: 0,
      longitude: 0,
      error: "",
      destination: "",
      predictions: [],
      pointCoords: []
    };

    this.onChangeTextHandlerDebounce = _.debounce(
      this.onChangeTextHandler,
      1000
    );
  }

  componentDidMount() {
    Geolocation.getCurrentPosition(
      position => {
        this.setState({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          error: false
        });
        this.getRouteDirections();
      },
      error => this.setState({ error: error.message }),
      { enableHighAccuracy: true, timeout: 2000 }
    );
  }

  getRouteDirections = async (placeId, description) => {
    if (placeId) {
      let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${this.state.latitude},${this.state.longitude}&destination=place_id:${placeId}&key=${key}`;

      try {
        const reponse = await fetch(url);
        const json = await reponse.json();
        const points = PolyLine.decode(json.routes[0].overview_polyline.points);
        const pointCoords = points.map(point => ({
          latitude: point[0],
          longitude: point[1]
        }));
        Keyboard.dismiss();
        this.map.fitToCoordinates(pointCoords);
        this.setState({ pointCoords, predictions: [], description });
      } catch (e) {
        console.log(e);
      }
    }
  };

  onChangeTextHandler = async text => {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${key}&input=${text}&location=${this.state.latitude},${this.state.longitude}&radius=200`;

    try {
      const result = await fetch(url);
      const json = await result.json();
      this.setState({
        predictions: json.predictions
      });
    } catch (err) {
      alert(err);
    }
  };

  render() {
    let marker = null;
    if (this.state.pointCoords.length > 1) {
      marker = (
        <Marker
          coordinate={this.state.pointCoords[this.state.pointCoords.length - 1]}
        />
      );
    }
    const predictions = this.state.predictions.map(p => (
      <TouchableHighlight
        onPress={() => {
          this.setState({ destination: p.structured_formatting.main_text });
          return this.getRouteDirections(
            p.place_id,
            p.structured_formatting.main_text
          );
        }}
        key={p.id}
      >
        <View>
          <Text
            style={{
              backgroundColor: "white",
              padding: 5,
              fontSize: 18,
              borderWidth: 0.5,
              marginLeft: 5,
              marginRight: 5
            }}
          >
            {p.structured_formatting.main_text}
          </Text>
        </View>
      </TouchableHighlight>
    ));
    return (
      <View style={StyleSheet.absoluteFillObject}>
        <MapView
          ref={map => (this.map = map)}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: this.state.latitude,
            longitude: this.state.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421
          }}
          showsUserLocation={true}
        >
          <Polyline
            coordinates={this.state.pointCoords}
            strokeWidth={2}
            strokeColor="red"
          />
          {marker}
        </MapView>
        <TextInput
          placeholder="Enter destination ..."
          value={this.state.destination}
          onChangeText={destination => {
            this.setState({ destination });
            this.onChangeTextHandlerDebounce(destination);
          }}
          style={{
            height: 40,
            borderWidth: 0.5,
            marginTop: 25,
            marginLeft: 5,
            marginRight: 5,
            backgroundColor: "white"
          }}
        />
        {predictions}
      </View>
    );
  }
}
