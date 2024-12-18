import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Button,
} from "react-native";
import firebase from "../../Config";
import Icon from "react-native-vector-icons/MaterialIcons"; // For add button
import { useNavigation } from "@react-navigation/native";

const database = firebase.database();
const auth = firebase.auth();
const ref_tableGroups = database.ref("GroupsTable");
const ref_tableProfils = database.ref("ProfilsTable");

export default function ListGroups(props) {
  const [data, setData] = useState([]);
  const [createdGroups, setCreatedGroups] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = auth.currentUser;
  const currentUserId = currentUser ? currentUser.uid : null;

  useEffect(() => {
    // Fetch groups data
    const fetchGroups = () => {
      ref_tableGroups.on("value", (snapshot) => {
        const groups = [];
        snapshot.forEach((group) => {
          const groupData = group.val();
          groups.push(groupData);
        });

        setData(
          groups.filter((group) => group.members.includes(currentUserId))
        );
        setCreatedGroups(
          groups.filter((group) => group.admin === currentUserId)
        );
        setLoading(false);
      });
    };

    // Fetch profiles data
    const fetchProfiles = () => {
      ref_tableProfils.on("value", (snapshot) => {
        const profilesList = [];
        snapshot.forEach((profile) => {
          profilesList.push(profile.val());
        });
        setProfiles(profilesList);
      });
    };

    fetchGroups();
    fetchProfiles();

    return () => {
      ref_tableGroups.off();
      ref_tableProfils.off();
    };
  }, []);

  const filteredProfiles = profiles.filter(
    (profile) => profile.id !== currentUserId
  );

  const toggleProfileSelection = (profileId) => {
    setSelectedProfiles((prevSelected) =>
      prevSelected.includes(profileId)
        ? prevSelected.filter((id) => id !== profileId)
        : [...prevSelected, profileId]
    );
  };

  const handleCreateGroup = () => {
    if (!newGroupName) {
      console.log("Please enter a group name");
      return;
    }
    const key = ref_tableGroups.push().key;
    const newGroup = {
      id: key,
      name: newGroupName,
      admin: currentUserId,
      members: [currentUserId, ...selectedProfiles],
    };

    ref_tableGroups.child(key).set(newGroup);

    setNewGroupName("");
    setSelectedProfiles([]);
    setModalVisible(false);
  };

  // Filter groups by search query
  const filteredGroups = data.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ImageBackground
      source={require("../../assets/imgbleu.jpg")}
      style={styles.container}
    >
      <StatusBar style="light" />
      <Text style={styles.title}>My Groups</Text>

      <View style={styles.textinputstyle}>
        <TextInput
          placeholder="Search groups..."
          placeholderTextColor="#bbb"
          style={{ flex: 1, color: "#FFF" }}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Icon name="search" size={25} color="white" />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="white" />
      ) : (
        <>
          {/* List of Groups */}
          <FlatList
            data={filteredGroups}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  props.navigation.navigate("ChatGroup", { group: item })
                }
                style={styles.groupItem}
              >
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupMeta}>
                  Admin: {item.admin === currentUserId ? "You" : "Someone"}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.noGroups}>No Groups Found</Text>
            }
            style={styles.listContainer}
          />

          <Text style={styles.subTitle}>Groups You Created</Text>
          <FlatList
            data={createdGroups}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.groupItem}>
                <Text style={styles.groupName}>{item.name}</Text>
              </View>
            )}
          />
        </>
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.floatingButton}
      >
        <Icon name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Modal for Creating Group */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Group Name"
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <Text style={styles.selectProfilesTitle}>Select Members</Text>
            <FlatList
              data={filteredProfiles}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => toggleProfileSelection(item.id)}
                  style={styles.profileItem}
                >
                  <Text
                    style={[
                      styles.profileName,
                      selectedProfiles.includes(item.id) &&
                        styles.selectedProfile,
                    ]}
                  >
                    {item.nom}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.profileList}
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Create" onPress={handleCreateGroup} />
            </View>
          </View>
        </View>
      </Modal>
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
  },
  listContainer: {
    width: "100%",
    padding: 10,
  },
  title: {
    fontSize: 35,
    color: "#fff",
    fontWeight: "bold",
    marginTop: 50,
    textAlign: "center",
  },
  subTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    textAlign: "center",
  },
  searchInput: {
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  groupItem: {
    backgroundColor: "#d6d6d6",
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  groupName: {
    fontSize: 18,
    // color: "#fff",
    fontWeight: "bold",
  },
  groupMeta: {
    fontSize: 14,
    color: "#545454",
  },
  createdGroupItem: {
    backgroundColor: "white",
    color: "#000",
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  noGroups: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#2196F3",
    borderRadius: 50,
    padding: 15,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: "bold",
  },
  selectProfilesTitle: {
    fontSize: 16,
    marginVertical: 10,
    fontWeight: "bold",
  },
  modalInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
  profileItem: {
    padding: 10,
  },
  profileName: {
    fontSize: 16,
  },
  selectedProfile: {
    color: "green",
    fontWeight: "bold",
  },
  profileList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
});
