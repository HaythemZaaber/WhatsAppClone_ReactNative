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
} from "react-native";
import firebase from "../../Config";
import Icon from "react-native-vector-icons/MaterialIcons";

const database = firebase.database();
const ref_tableProfils = database.ref("ProfilsTable");

export default function ListProfils(props) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = firebase.auth().currentUser?.uid;

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (!user) {
        props.navigation.replace("Auth");
      }
    });

    const fetchData = () => {
      ref_tableProfils.on("value", (snapshot) => {
        const profiles = [];
        snapshot.forEach((unprofil) => {
          profiles.push(unprofil.val());
        });
        setData(profiles);
        setLoading(false);
      });
    };

    fetchData();

    return () => {
      ref_tableProfils.off();
      unsubscribe();
    };
  }, [userId]);

  const handleCall = (phoneNumber) => {
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

  const renderItem = React.useCallback(
    ({ item }) => {
      return (
        <TouchableHighlight
          onPress={() => props.navigation.navigate("Chat", { profile: item })}
          underlayColor="#ddd"
          style={styles.contactContainer}
        >
          <View style={styles.contactInner}>
            <Image
              source={
                item.profileImage
                  ? { uri: item.profileImage }
                  : require("../../assets/profil.png")
              }
              style={styles.profileImage}
            />
            <View style={styles.textContainer}>
              <Text style={styles.contactName}>
                {item.id === userId ? "MySelf" : item.nom}
              </Text>
              <Text style={styles.contactPseudo}>@{item.pseudo}</Text>
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
    },
    [userId]
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
      <FlatList
        data={data}
        // keyExtractor={(item, index) =>
        //   item.id ? item.id.toSt                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
        style={styles.listContainer}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
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
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: "#ccc",
  },
  textContainer: {
    flex: 1,
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
});
