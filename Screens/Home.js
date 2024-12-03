import React, { useEffect } from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import ListProfils from "./Home/ListProfils";
import Groupes from "./Home/Groupes";
import MyProfil from "./Home/MyProfil";
import Icon from "react-native-vector-icons/MaterialIcons";
import firebase from "../Config";

const Tab = createMaterialBottomTabNavigator();

export default function Home(props) {
  const theme = useColorScheme();
  const tabBarBackgroundColor = theme === "dark" ? "#333" : "#f8f8f8";

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (!user) {
        props.navigation.replace("Auth");
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          let iconSize = focused ? 30 : 24;
          if (route.name === "ListProfils") iconName = "list";
          if (route.name === "Groupes") iconName = "group";
          if (route.name === "MyProfile") iconName = "person";
          return <Icon name={iconName} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: "#007aff",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: { backgroundColor: tabBarBackgroundColor },
      })}
    >
      <Tab.Screen
        name="ListProfils"
        component={ListProfils}
        options={{ accessibilityLabel: "Profiles tab" }}
      />
      <Tab.Screen
        name="Groupes"
        component={Groupes}
        options={{ accessibilityLabel: "Groups tab" }}
      />
      <Tab.Screen
        name="MyProfile"
        component={MyProfil}
        options={{ accessibilityLabel: "My Profile tab" }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
