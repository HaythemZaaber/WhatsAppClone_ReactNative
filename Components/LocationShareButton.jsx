// components/LocationShareButton.js
import React from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";

const LocationShareButton = ({
  userId,
  receiverId,
  discussionRef,
  onLocationShare,
}) => {
  const shareLocation = async () => {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "You need to enable location access to share your location"
        );
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Create location message
      const locationMessage = {
        type: "location",
        text: `https://www.google.com/maps?q=${latitude},${longitude}`,
        sender: userId,
        receiver: receiverId,
        date: new Date().toISOString(),
      };

      // Send to Firebase
      discussionRef.push(locationMessage);

      // Optional callback
      onLocationShare?.({ latitude, longitude });

      Alert.alert("Location Shared", "Your current location has been sent.");
    } catch (error) {
      console.error("Location share error:", error);
      Alert.alert("Error", "Failed to share location");
    }
  };

  return (
    <TouchableOpacity style={styles.locationButton} onPress={shareLocation}>
      <Text style={styles.buttonText}>📍</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  locationButton: {
    backgroundColor: "#0F52BA",
    borderRadius: 25,
    padding: 10,
  },
  buttonText: {
    fontSize: 20,
    color: "white",
  },
});

export default LocationShareButton;
