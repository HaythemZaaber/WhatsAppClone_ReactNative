import React, { useState } from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import firebase from "../Config";

const auth = firebase.auth();

export default function Auth({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Input Error", "Please fill in both email and password.");
      return;
    }

    setLoading(true);
    auth
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        setLoading(false);
        navigation.replace("Home"); 
      })
      .catch((error) => {
        setLoading(false);
        Alert.alert("Login Failed", error.message);
      });
  };

  return (
    <ImageBackground
      source={require("../assets/bg.jpg")}
      style={styles.container}
    >
      <StatusBar style="auto" />
      <View style={styles.card}>
        <Text style={styles.welcomeText}>Bienvenue</Text>

        {/* Email Input */}
        <TextInput
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor="black"
          value={email}
          onChangeText={setEmail}
          style={styles.textInput}
          accessible
          accessibilityLabel="Email Input"
        />

        {/* Password Input */}
        <TextInput
          placeholder="Password"
          placeholderTextColor="black"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.textInput}
          accessible
          accessibilityLabel="Password Input"
        />

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.exitButton}
            onPress={() => navigation.goBack()} 
            accessible
            accessibilityLabel="Exit Button"
          >
            <Text style={styles.buttonText}>Exit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
            accessible
            accessibilityLabel="Submit Button"
          >
            <Text style={styles.buttonText}>
              {loading ? "Loading..." : "Submit"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Navigate to Sign-Up Screen */}
        <TouchableOpacity
          onPress={() => navigation.navigate("NewUser")}
          accessible
          accessibilityLabel="Create New User Link"
        >
          <Text style={styles.newUserText}>Create new user</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#0007",
    height: 350,
    width: "90%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    gap: 10,
    padding: 20,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: "bold",
    fontStyle: "italic",
    color: "#fff",
    marginBottom: 20,
  },
  textInput: {
    height: 50,
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    color: "black",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: "45%",
    alignItems: "center",
  },
  exitButton: {
    backgroundColor: "#F44336",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: "45%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "#A5D6A7",
  },
  newUserText: {
    width: "100%",
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
    fontStyle: "italic",
    marginTop: 15,
    fontSize: 16,
    textDecorationLine: "underline",
  },
});
