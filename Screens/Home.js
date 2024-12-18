import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import ListProfils from "./Home/ListProfils";
import Groupes from "./Home/Groupes";
import MyProfil from "./Home/MyProfil";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import firebase from "../Config";
import { LogBox } from "react-native";

// Suppress specific warning logs
LogBox.ignoreLogs([
  'A props object containing a "key" prop is being spread into JSX',
]);

const Tab = createMaterialBottomTabNavigator();
const ref_tableProfils = firebase.database().ref("ProfilsTable");

// Tab Icon Component
const TabIcon = ({ name, focused, color }) => (
  <Icon name={name} size={focused ? 30 : 24} color={color} />
);

// Tab Navigator Component
const AppTabNavigator = ({ profileExist }) => (
  <Tab.Navigator
    initialRouteName={profileExist ? "ListProfils" : "MyProfile"}
    activeColor="#000"
    inactiveColor="#fff"
    barStyle={{ backgroundColor: "#0b75a7" }}
  >
    {profileExist && (
      <Tab.Screen
        name="ListProfils"
        component={ListProfils}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="list" focused={focused} color={color} />
          ),
        }}
      />
    )}

    {profileExist && (
      <Tab.Screen
        name="Groupes"
        component={Groupes}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="group" focused={focused} color={color} />
          ),
        }}
      />
    )}

    <Tab.Screen
      name="MyProfile"
      component={MyProfil}
      options={{
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name="person" focused={focused} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

export default function Home() {
  const [profileExist, setProfileExist] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const userId = firebase.auth().currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      navigation.replace("Auth");
      return;
    }

    const userProfileRef = ref_tableProfils.child(`Profil${userId}`);

    userProfileRef.once("value").then((snapshot) => {
      if (snapshot.exists()) {
        userProfileRef.update({ isConnected: true });
      }
    });

    const handleProfileCheck = (snapshot) => {
      setProfileExist(!!snapshot.val());
      setLoading(false);
    };

    userProfileRef.on("value", handleProfileCheck);

    return () => userProfileRef.off("value", handleProfileCheck);
  }, [userId, navigation]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return <AppTabNavigator profileExist={profileExist} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
