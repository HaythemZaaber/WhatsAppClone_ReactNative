import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  TextInput,
} from "react-native";
import firebase from "../../Config";
import Icon from "react-native-vector-icons/MaterialIcons";

const database = firebase.database();
const ref_tableProfils = database.ref("ProfilsTable");
const ref_discussions = database.ref("TheDiscussions");

export default function ListProfils(props) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = firebase.auth().currentUser?.uid;
  const [search, setSearch] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (!user) {
        props.navigation.replace("Auth");
      }
    });

    const fetchData = () => {
      const profileListeners = []; // To store real-time listeners for cleanup
      const listener = ref_tableProfils.on("value", (snapshot) => {
        const profiles = [];
        const listeners = [];

        snapshot.forEach((unprofil) => {
          const profileData = unprofil.val();
          if (profileData.id !== userId) {
            profiles.push({ ...profileData, lastMessage: "Loading..." });

            // Setup a real-time listener for the last message
            const discussionId =
              userId > profileData.id
                ? userId + profileData.id
                : profileData.id + userId;

            const lastMessageListener = ref_discussions
              .child(discussionId)
              .orderByChild("date")
              .limitToLast(1)
              .on("value", (messageSnapshot) => {
                const message = messageSnapshot.val();

                let lastMessage = "No messages yet"; // Default message
                if (message) {
                  const [key] = Object.keys(message);
                  const lastMessageData = message[key];

                  // Determine message type
                  if (lastMessageData.type === "text") {
                    lastMessage = lastMessageData.text;
                  } else if (lastMessageData.type === "image") {
                    lastMessage = "📷 Image";
                  } else if (lastMessageData.type === "location") {
                    lastMessage = "📍 Location";
                  } else if (lastMessageData.type === "file") {
                    lastMessage = "📁 File";
                  } else {
                    lastMessage = "Unknown message type";
                  }
                }

                // Update last message for the relevant profile in state
                setData((prevData) =>
                  prevData.map((profile) =>
                    profile.id === profileData.id
                      ? { ...profile, lastMessage }
                      : profile
                  )
                );
              });

            listeners.push(() =>
              ref_discussions
                .child(discussionId)
                .off("value", lastMessageListener)
            );
          }
        });

        setData(profiles);
        setLoading(false);

        // Store the cleanup listeners for later use
        profileListeners.push(...listeners);
      });

      // Return a cleanup function
      return () => {
        // Remove listeners for profiles
        profileListeners.forEach((cleanup) => cleanup());

        // Remove the main profile listener
        ref_tableProfils.off("value", listener);
      };
    };

    const listenerCleanup = fetchData();

    return () => {
      listenerCleanup();
      unsubscribe();
    };
  }, [userId, props.navigation]);

  useEffect(() => {
    const filtered = data.filter(
      (profile) =>
        profile?.nom?.toLowerCase().includes(search?.toLowerCase()) ||
        profile?.pseudo?.toLowerCase().includes(search?.toLowerCase())
    );
    setFilteredData(filtered);
  }, [search, data]);

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) {
      alert("Invalid phone number.");
      return;
    }

    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          alert("Phone calls are not supported on this device.");
        } else {
          return Linking.openURL(url);
        }
      })
      .catch(() => alert("An error occurred while trying to make the call."));
  };

  const renderItem = ({ item }) => (
    <TouchableHighlight
      onPress={() => props.navigation.navigate("Chat", { profile: item })}
      underlayColor="#ddd"
      style={styles.contactContainer}
    >
      <View style={styles.contactInner}>
        <View style={styles.statusContainer}>
          <Image
            source={
              item.profileImage
                ? { uri: item.profileImage }
                : require("../../assets/profil.png")
            }
            style={styles.profileImage}
          />

          <View
            style={[
              styles.onlineDot,
              {
                backgroundColor: item?.isConnected ? "green" : "gray",
              },
            ]}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.contactName}>
            {item.id === userId ? "MySelf" : item.nom}
          </Text>
          <Text style={styles.contactPseudo}>@{item.pseudo || "Unknown"}</Text>
          {item.lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          )}
        </View>
        {item.telephone && (
          <TouchableOpacity
            onPress={() => handleCall(item.telephone)}
            style={styles.phoneIcon}
          >
            <Icon name="phone" size={25} color="#4CAF50" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableHighlight>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007aff" />
        <Text style={styles.loadingText}>Loading profiles...</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No profiles found.</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/imgbleu.jpg")}
      style={styles.container}
    >
      <StatusBar style="light" />
      <Text style={styles.textstyle}>List Profils</Text>

      <View style={styles.textinputstyle}>
        <TextInput
          placeholder="Search profiles"
          placeholderTextColor="#bbb"
          style={{ flex: 1, color: "#FFF" }}
          value={search}
          onChangeText={(text) => setSearch(text)}
        />
        <Icon name="search" size={25} color="white" />
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={renderItem}
        style={styles.listContainer}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  textinputstyle: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#0004",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 20,
    color: "#FFF",
    width: "95%",
    height: 50,
    borderRadius: 10,
    margin: 5,
    paddingHorizontal: 15,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  textstyle: {
    fontSize: 32,
    fontFamily: "serif",
    color: "white",
    fontWeight: "bold",
    marginTop: 40,
    marginBottom: 20,
  },
  listContainer: {
    width: "100%",
    padding: 10,
  },
  contactContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginBottom: 10,
    borderRadius: 8,
    padding: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  contactInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ccc",
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  contactPseudo: {
    fontSize: 14,
    color: "#666",
  },
  lastMessage: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
  },
  phoneIcon: {
    padding: 10,
    backgroundColor: "#E8F5E9",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    fontSize: 18,
    color: "#888",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#fff",
  },
});
