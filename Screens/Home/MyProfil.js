import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
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
} from "react-native";
import firebase from "../../Config";
import { supabase } from "../../Config/initSupabase";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const database = firebase.database();
const ref_tableProfils = database.ref("ProfilsTable");

export default function MyProfil(props) {
  const [nom, setNom] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [telephone, setTelephone] = useState("");
  const [isDefaultImage, setIsDefaultImage] = useState(true);
  const [uriLocalImage, setUriLocalImage] = useState("");
  const [localImageName, setLocalImageName] = useState("");

  const userId = firebase.auth().currentUser.uid;

  useEffect(() => {
    const userProfileRef = ref_tableProfils.child(`Profil${userId}`);
    userProfileRef.on("value", (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setNom(data.nom || "");
        setPseudo(data.pseudo || "");
        setTelephone(data.telephone || "");
        if (data.profileImage) {
          setUriLocalImage(data.profileImage);
          setIsDefaultImage(false);
        }
      }
    });

    return () => userProfileRef.off();
  }, []);

  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Denied",
          "You need to allow access to your media library to select an image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        if (!uri) throw new Error("Failed to get image URI.");
        setUriLocalImage(uri);
        setIsDefaultImage(false);
        console.log("Picked image URI:", uri);

        await uploadImageToSupabase(uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image.");
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Denied",
          "You need to allow access to your camera to take a photo."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        if (!uri) throw new Error("Failed to get image URI.");
        setUriLocalImage(uri);
        setIsDefaultImage(false);
        console.log("Captured image URI:", uri);

        await uploadImageToSupabase(uri);
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
      Alert.alert("Error", "Failed to capture photo.");
    }
  };

  const uploadImageToSupabase = async (urilocal) => {
    try {
      const response = await fetch(urilocal);
      const blob = await response.blob();
      const arraybuffer = await new Response(blob).arrayBuffer();

      if (!userId) {
        console.error("userId is invalid:", userId);
        return null;
      }

      const uniqueImageId = new Date().getTime().toString();
      const { error: uploadError } = await supabase.storage
        .from("profileImages")
        .upload(`Profil${uniqueImageId}`, arraybuffer, { upsert: true });

      if (uploadError) {
        console.error(
          "Error uploading image:",
          uploadError.message
        );
        return null;
      }

      const { data, error: getError } = await supabase.storage
        .from("profileImages")
        .getPublicUrl(`Profil${uniqueImageId}`);

      if (getError) {
        console.error(
          "Error getting image public URL:",
          getError.message
        );
        return null;
      }

      if (!data || !data.publicUrl) {
        console.error("Public URL is not available:", data);
        return null;
      }

      console.log("Public image URL:", data.publicUrl);
      await ref_tableProfils.child(`Profil${userId}`).update({
        profileImage: data.publicUrl,
      });

      Alert.alert("Success", "Profile picture updated!");
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const saveProfile = () => {
    if (!nom || !pseudo || !telephone) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    const userProfileRef = ref_tableProfils.child(`Profil${userId}`);
    userProfileRef
      .update({
        id: userId,
        nom,
        pseudo,
        telephone,
      })
      .then(() => Alert.alert("Success", "Profile updated successfully!"))
      .catch((error) => Alert.alert("Error", error.message));
  };

  return (
    <ImageBackground
      source={require("../../assets/imgbleu.jpg")}
      style={styles.container}
    >
      <StatusBar style="light" />
      <Text style={styles.textstyle}>My Account</Text>

      <View style={styles.imageContainer}>
        <TouchableHighlight>
          <Image
            source={
              isDefaultImage
                ? require("../../assets/profil.png")
                : { uri: uriLocalImage }
            }
            style={styles.profileImage}
          />
        </TouchableHighlight>

        <TouchableOpacity style={styles.cameraIcon} onPress={pickImage}>
          <Image
            source={require("../../assets/camera-icon.png")}
            style={{ width: 30, height: 30 }}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.takePhotoIcon} onPress={takePhoto}>
          <Image
            source={require("../../assets/camera-icon.png")}
            style={{ width: 30, height: 30 }}
          />
        </TouchableOpacity>
      </View>

      <TextInput
        value={nom}
        onChangeText={setNom}
        textAlign="center"
        placeholderTextColor="#fff"
        placeholder="Nom"
        keyboardType="default"
        style={styles.textinputstyle}
      />
      <TextInput
        value={pseudo}
        onChangeText={setPseudo}
        textAlign="center"
        placeholderTextColor="#fff"
        placeholder="Pseudo"
        keyboardType="default"
        style={styles.textinputstyle}
      />
      <TextInput
        value={telephone}
        onChangeText={setTelephone}
        placeholderTextColor="#fff"
        textAlign="center"
        placeholder="Numero"
        keyboardType="phone-pad"
        style={styles.textinputstyle}
      />

      <TouchableHighlight
        onPress={saveProfile}
        activeOpacity={0.5}
        underlayColor="#DDDDDD"
        style={styles.saveButton}
      >
        <Text style={{ color: "#FFF", fontSize: 24 }}>Save</Text>
      </TouchableHighlight>
      <TouchableHighlight
        onPress={async () => {
          try {
            await firebase.auth().signOut();
            await AsyncStorage.removeItem("email");
            await AsyncStorage.removeItem("password");
            props.navigation.replace("Auth");
          } catch (error) {
            Alert.alert("Logout Error", error.message);
          }
        }}
        activeOpacity={0.5}
        underlayColor="#DDDDDD"
        style={styles.deconnectionButton}
      >
        <Text style={{ color: "#FFF", fontSize: 24 }}>Sign Out</Text>
      </TouchableHighlight>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    position: "relative",
  },
  profileImage: {
    height: 200,
    width: 200,
    borderRadius: 100,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 5,
  },
  takePhotoIcon: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 5,
  },
  textinputstyle: {
    fontWeight: "bold",
    backgroundColor: "#0004",
    fontSize: 20,
    color: "#fff",
    width: "75%",
    height: 50,
    borderRadius: 10,
    margin: 5,
  },
  textstyle: {
    fontSize: 40,
    fontFamily: "serif",
    color: "white",
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    marginBottom: 10,
    borderColor: "#00f",
    borderWidth: 2,
    backgroundColor: "#08f6",
    height: 60,
    width: "50%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    marginTop: 20,
  },
  deconnectionButton: {
    marginBottom: 10,
    borderColor: "#f00",
    borderWidth: 2,
    backgroundColor: "#f86",
    height: 60,
    width: "50%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    marginTop: 20,
  },
});
