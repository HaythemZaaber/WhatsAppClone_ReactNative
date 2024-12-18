// components/ImagePickerButton.js
import React from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  Alert,
  View,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../Config/initSupabase";

const ImagePickerButton = ({
  onImagePick,
  userId,
  receiverId,
  discussionRef,
}) => {
  const handleImagePick = async (fromCamera) => {
    try {
      // Request permissions
      const permissionResult = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Denied",
          "You need to allow access to your media library."
        );
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
          });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        if (!uri) throw new Error("Failed to get image base64 data.");
        await uploadImage(uri);
      }
    } catch (error) {
      console.error("Image pick error:", error);
    }
  };

  const uploadImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arraybuffer = await new Response(blob).arrayBuffer();

      const uniqueImageId = new Date().getTime().toString();
      const { error: uploadError } = await supabase.storage
        .from("profileImages")
        .upload(`Chat${uniqueImageId}`, arraybuffer, { upsert: true });

      if (error) throw error;

      // Construct image URL
      const imageUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${data.fullPath}`;

      // Create message in Firebase
      const newImageMessage = {
        type: "image",
        imageUrl: imageUrl,
        sender: userId,
        receiver: receiverId,
        date: new Date().toISOString(),
      };

      // Push to Firebase discussion
      discussionRef.push(newImageMessage);

      // Callback for additional handling if needed
      onImagePick?.(imageUrl);
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Upload Failed", "Could not upload image");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.cameraButton}
        onPress={() => handleImagePick(true)}
      >
        <Text style={styles.buttonText}>📷</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.galleryButton}
        onPress={() => handleImagePick(false)}
      >
        <Text style={styles.buttonText}>🖼️</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  cameraButton: {
    backgroundColor: "#0F52BA",
    borderRadius: 25,
    padding: 10,
  },
  galleryButton: {
    backgroundColor: "#0F52BA",
    borderRadius: 25,
    padding: 10,
  },
  buttonText: {
    fontSize: 20,
    color: "white",
  },
});

export default ImagePickerButton;
