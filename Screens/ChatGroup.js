import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  Linking,
  ImageBackground,
} from "react-native";
import FlashMessage from "react-native-flash-message";
import { StatusBar } from "expo-status-bar";
import firebase from "../Config"; // Update this to your Firebase config file
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../Config/initSupabase"; // Import Supabase client
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
// import * as FileSystem from "expo-file-system";
import moment from "moment";
// import * as DocumentPicker from "expo-document-picker";
import { decode } from "base64-arraybuffer";
import * as Location from "expo-location";
import Ionicons from "react-native-vector-icons/MaterialIcons";
import { LogBox } from "react-native";
import ChatGroupHeader from "../Components/ChatGroupHeader";
const reflesdiscussions = firebase.database().ref("TheDiscussions");
const reflesprofils = firebase.database().ref("ProfilsTable");

// Suppress specific warning logs
LogBox.ignoreLogs(["Text strings must be rendered within a <Text> component"]);

export default function Chat(props) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const userId = firebase.auth().currentUser.uid;
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [reactionModalVisible, setReactionModalVisible] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const group = props.route.params.group;
  const ref_groupChat = reflesdiscussions.child(group.id);

  useEffect(() => {
    ref_groupChat.on("value", (snapshot) => {
      const fetchedMessages = [];
      snapshot.forEach((child) => {
        if (child.key !== "typing") {
          fetchedMessages.push({ id: child.key, ...child.val() });
        }
      });
      setMessages(processMessagesWithDateSeparators(fetchedMessages.reverse()));
    });
    reflesprofils.on("value", (snapshot) => {
      const fetchedProfiles = [];
      snapshot.forEach((child) => {
        fetchedProfiles.push({ id: child.key, ...child.val() });
      });
      setProfiles(fetchedProfiles);
      console.log(fetchedProfiles);
    });

    return () => {
      ref_groupChat.off();
      reflesprofils.off();
    };
  }, []);

  const processMessagesWithDateSeparators = (messages) => {
    if (messages.length === 0) return [];

    const processedMessages = [];
    let currentDate = null;

    messages.forEach((message, index) => {
      const messageDate = moment(message.date).format("YYYY-MM-DD");

      // Add date separator if date changes
      if (messageDate !== currentDate) {
        processedMessages.push({
          type: "dateSeparator",
          date: messageDate,
        });
        currentDate = messageDate;
      }
      processedMessages.push(message);
    });

    return processedMessages;
  };

  useEffect(() => {
    if (!messages.length) return;

    const lastMessage = messages[1];
    const ids = profiles.map((profile) => profile.id);
    if (ids.includes(userId) && lastMessage.sender!== userId && !lastMessage.seen?.status) {
      const messageRef = ref_groupChat.child(lastMessage.id);
      messageRef.update({
        seen: {
          status: true,
          time: new Date().toISOString(),
        },
      });
    }
  }, [messages]);

  useEffect(() => {
    const typingRef = ref_groupChat.child("typing");
    typingRef.on("value", (snapshot) => {
      const typingUsers = [];
      snapshot.forEach((child) => {
        if (child.key !== userId && child.val()) {
          typingUsers.push(child.key);
        }
      });
      setOtherTyping(typingUsers);
    });

    return () => typingRef.off();
  }, []);

  // Update typing status in Firebase
  const handleInputChange = (text) => {
    setInputText(text);
    const typingRef = ref_groupChat.child("typing").child(userId);
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      typingRef.set(true);
    } else if (text.length === 0 && isTyping) {
      setIsTyping(false);
      typingRef.set(false);
    }
  };

  const addReaction = (messageId, reaction) => {
    const messageRef = ref_groupChat.child(messageId);

    messageRef.child("reactions").update({
      [userId]: reaction, // Add or update the reaction for the current user
    });
  };

  const openReactionModal = (messageId) => {
    setSelectedMessageId(messageId);
    setReactionModalVisible(true);
  };

  const handleReaction = (reaction) => {
    if (selectedMessageId) {
      addReaction(selectedMessageId, reaction);
    }
    setReactionModalVisible(false);
  };

  // Send a new message to Firebase
  const sendMessage = () => {
    if (inputText.trim() === "") return;
    const key = ref_groupChat.push().key;
    const ref_groupChat_key = ref_groupChat.child(key);
    console.log(userId);
    const senderName = profiles.find((profile) => profile.id === userId)?.nom;
    console.log("Sender Profile:", senderName); // Debugging: Log the profile object
    const newMessage = {
      id: key,
      text: inputText,
      sender: userId,
      senderName: senderName,
      date: new Date().toISOString(),
      type: "text",
      seen: {
        status: false,
        time: null,
      },
      reactions: {},
    };

    ref_groupChat_key.set(newMessage);
    setInputText("");
    const typingRef = ref_groupChat.child("typing").child(userId);
    typingRef.set(false);
    setIsTyping(false);
  };

  const renderMessage = ({ item }) => {
    if (item.type === "dateSeparator") {
      return (
        <View style={styles.dateSeparatorContainer}>
          <View style={styles.dateSeparatorLine} />
          <Text style={styles.dateSeparatorText}>
            {moment(item.date).calendar(null, {
              sameDay: "[Today]",
              lastDay: "[Yesterday]",
              sameElse: "MMMM D, YYYY",
            })}
          </Text>
          <View style={styles.dateSeparatorLine} />
        </View>
      );
    }

    const isMe = item.sender === userId;

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isMe ? styles.myMessage : styles.otherMessage,
          (item.type === "image" ||
            item.type === "location" ||
            item.type === "file") && {
            backgroundColor: "transparent",
          },
        ]}
        onLongPress={() => openReactionModal(item.id)} // Added this line
      >
        {item.type === "text" ? (
          <View>
            <TouchableOpacity>
              <Text style={styles.messageText}>{item.text}</Text>
              <Text style={styles.messageTime}>
                {moment(item.date).format("HH:mm")}
              </Text>
            </TouchableOpacity>
            {item.reactions && Array.isArray(Object.values(item.reactions)) && (
              <View style={styles.reactionsContainer}>
                {Object.values(item.reactions).map((reaction, index) => (
                  <Text key={index} style={styles.reaction}>
                    {reaction}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ) : item.type === "location" ? (
          <View>
            <TouchableOpacity
              onPress={() => Linking.openURL(item.text)} // Open the Google Maps link
              style={styles.locationMessage}
            >
              <Text style={styles.locationText}>📍 My Location</Text>
              <Text style={styles.messageTime}>
                {moment(item.date).format("HH:mm")}
              </Text>
            </TouchableOpacity>
            {item.reactions && Array.isArray(Object.values(item.reactions)) && (
              <View style={styles.reactionsContainer}>
                {Object.values(item.reactions).map((reaction, index) => (
                  <Text key={index} style={styles.reaction}>
                    {reaction}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ) : item.type === "file" ? (
          <View>
            <TouchableOpacity
              onPress={() => Linking.openURL(item.fileUrl)}
              style={styles.locationMessage}
            >
              <Text style={styles.locationText}>📎 {item.fileName}</Text>
              <Text style={styles.messageTime}>
                {moment(item.date).format("HH:mm")}
              </Text>
            </TouchableOpacity>
            {item.reactions && Array.isArray(Object.values(item.reactions)) && (
              <View style={styles.reactionsContainer}>
                {Object.values(item.reactions).map((reaction, index) => (
                  <Text key={index} style={styles.reaction}>
                    {reaction}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View>
            <TouchableOpacity>
              <Image
                source={{ uri: item.fileUrl }}
                style={styles.imageMessage}
              />
              <Text style={styles.messageTime}>
                {moment(item.date).format("HH:mm")}
              </Text>
            </TouchableOpacity>
            {item.reactions && Array.isArray(Object.values(item.reactions)) && (
              <View style={styles.reactionsContainer}>
                {Object.values(item.reactions).map((reaction, index) => (
                  <Text key={index} style={styles.reaction}>
                    {reaction}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
        {item.sender !== userId && (
          <Text style={styles.senderName}>{item?.senderName || "User"}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const handleFilePick = async (fromCamera, fileType = "image") => {
    try {
      // Request permissions for either media library or camera
      const permissionResult = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Denied",
          `You need to allow access to your ${
            fromCamera ? "camera" : "media library"
          } to select a file.`
        );
        return;
      }

      let result;

      if (fileType === "image") {
        // Handle images via camera or library
        result = fromCamera
          ? await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [4, 3],
              quality: 1,
              base64: true,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 1,
              base64: true,
            });
      } else {
        // Handle other file types
        result = await DocumentPicker.getDocumentAsync({
          type: "*/*", // Allows any file type
          copyToCacheDirectory: true,
        });
      }
      if (result.canceled) return;

      // For images, we use `result.assets[0].base64`, for files, use `uri`
      const fileUri =
        fileType === "image" ? result.assets[0].base64 : result.assets[0].uri;
      const fileName =
        fileType === "image" ? "image.jpg" : result.assets[0].name || "file";

      if (!fileUri) throw new Error("Failed to retrieve file data.");

      // Upload the file to Supabase
      await uploadFileToSupabase(fileUri, fileName, fileType);
    } catch (error) {
      Alert.alert(
        "Error",
        `Failed to pick ${fileType === "image" ? "image" : "file"}.`
      );
    }
  };

  const uploadFileToSupabase = async (fileUri, fileName, fileType) => {
    try {
      const key = ref_groupChat.push().key; // Generate unique key
      const ref_groupChat_key = ref_groupChat.child(key);

      if (fileType == "image") {
        fileName = `${key}.jpg`;
      }

      // Upload the file to the correct bucket
      const bucketName = fileType === "image" ? "profileImages" : "files"; // Define buckets for images vs. general files
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(
          fileName,
          fileType === "image" ? decode(fileUri) : { uri: fileUri },
          { contentType: fileType === "file" && "application/pdf" }
        );

      if (error) {
        console.log(error);
        throw error;
      }
      console.log("data", data);

      // Construct the public URL
      const fileUrl =
        process.env.EXPO_PUBLIC_SUPABASE_URL +
        "/storage/v1/object/public/" +
        data.fullPath;

      // Save the file's metadata as a new message in the database
      const newMessage = {
        id: key,
        fileUrl: fileUrl,
        fileName: fileName,
        sender: userId,
        date: new Date().toISOString(),
        type: fileType, // Store type as "image" or "file"
        reactions: [],
      };

      ref_groupChat_key.set(newMessage);

      Alert.alert(
        "Success",
        `${fileType === "image" ? "Image" : "File"} uploaded successfully!`
      );
    } catch (error) {
      Alert.alert(
        "Error",
        `Failed to upload ${fileType === "image" ? "image" : "file"}.`
      );
    }
  };

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

      // Construct a location message
      const key = ref_groupChat.push().key;
      const ref_groupChat_key = ref_groupChat.child(key);

      const newMessage = {
        id: key,
        text: `https://www.google.com/maps?q=${latitude},${longitude}`, // Link to Google Maps
        sender: userId,
        date: new Date().toISOString(),
        type: "location",
      };

      // Send message to Firebase
      ref_groupChat_key.set(newMessage);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to share location.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlashMessage position="top" />
      <StatusBar style="auto" />
      <ChatGroupHeader group={group} />
      <ImageBackground
        source={require("../assets/chatt.jpg")}
        style={{ flex: 1, backgroundColor: "#FEC" }}
      >
        <KeyboardAvoidingView behavior={Platform.OS} style={styles.flexGrow}>
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => index}
            contentContainerStyle={styles.messagesList}
            inverted
          />
          {/* "Seen" status for the last message */}
          {messages.length > 0 &&
            messages[0].sender === userId &&
            messages[0].seen?.status && (
              <Text style={styles.seenStatus}>
                Seen at {new Date(messages[0].seen?.time).toLocaleTimeString()}
              </Text>
            )}{" "}
          {/* "Seen" status for the last message */}
          {messages.length > 0 &&
            messages[1].sender === userId &&
            messages[1].seen?.status && (
              <Text style={styles.seenStatus}>
                {messages[1]?.seen?.time
                  ? `Seen at ${new Date(
                      messages[1].seen.time
                    ).toLocaleTimeString()}`
                  : "Not seen yet"}
              </Text>
            )}
          {/* Typing Indicator */}
          {otherTyping.length && (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>
                {otherTyping.length === 1
                  ? `${otherTyping[0]} is typing...`
                  : "Several people are typing..."}
              </Text>
            </View>
          )}
          {/* Input Field */}
          <View style={styles.inputContainer}>
            <TouchableOpacity
              onPress={() => handleFilePick(true)}
              style={styles.uploadButton}
            >
              {/* <Text style={styles.uploadButtonText}>📷</Text> */}
              <Ionicons name="camera-alt" size={25} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={styles.uploadButton}
            >
              {/* <Text style={styles.uploadButtonText}>🏞️</Text> */}
              <Ionicons name="upload-file" size={25} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={shareLocation}
              style={styles.uploadButton}
            >
              {/* <Text style={styles.shareLocationText}>📍</Text> */}
              <Ionicons name="location-pin" size={25} />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              value={inputText}
              onChangeText={handleInputChange}
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              {/* <Text style={styles.sendButtonText}>Send</Text> */}
              <Ionicons name="send" size={25} color="white" />
            </TouchableOpacity>
          </View>
          <Modal
            transparent={true}
            visible={isModalVisible}
            animationType="fade"
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              onPress={() => setModalVisible(false)}
            >
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    handleFilePick(false, "file");
                    setModalVisible(false);
                  }}
                >
                  <Ionicons name="upload-file" size={40} />
                  <Text style={styles.modalButtonText}>Upload File</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    handleFilePick(false, "image");
                    setModalVisible(false);
                  }}
                >
                  <Ionicons name="image" size={40} color="#000" />
                  <Text style={styles.modalButtonText}>Upload Image</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
          <Modal
            transparent={true}
            visible={reactionModalVisible}
            animationType="fade"
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              onPress={() => setReactionModalVisible(false)}
            >
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Choose Reaction</Text>
                <View style={styles.reactionsList}>
                  {["👍", "❤️", "😂", "😢", "😡"].map((reaction) => (
                    <TouchableOpacity
                      key={reaction}
                      onPress={() => handleReaction(reaction)}
                      style={styles.reactionButton}
                    >
                      <Text style={styles.reactionText}>{reaction}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  flexGrow: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#0F52BA",
  },
  headerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  messagesList: {
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  messageContainer: {
    maxWidth: "75%",
    borderRadius: 20,
    padding: 10,
    marginVertical: 5,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#0F52BA",
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "gray",
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#f5f5f5",
  },
  textInput: {
    flex: 1,
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9",
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#0F52BA",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  typingIndicator: {
    alignSelf: "flex-start",
    marginLeft: 10,
    marginBottom: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 15,
  },
  typingText: {
    color: "#666",
    fontStyle: "italic",
  },
  reactionPicker: {
    zIndex: 20,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-around",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 10,
    elevation: 5,
  },
  reactionsContainer1: {
    position: "absolute",
    bottom: -5,
    left: -15,
    flexDirection: "row",
    marginTop: 5,
    backgroundColor: "#d3d3d3",
    borderRadius: 20,
    padding: 2,
  },
  reactionsContainer2: {
    position: "absolute",
    bottom: -5,
    right: -15,
    flexDirection: "row",
    marginTop: 5,
    backgroundColor: "#d3d3d3",
    borderRadius: 20,
    padding: 2,
  },
  reaction: {
    fontSize: 14,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0078FF", // Messenger-style blue
    paddingHorizontal: 15,
    paddingVertical: 10,
    elevation: 4, // Shadow for Android
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 10,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#ccc", // Fallback color for loading
  },
  pseudoText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  nameText: {
    color: "#e0e0e0", // Subtle contrast for the name
    fontSize: 14,
  },
  callButton: {
    padding: 10,
    backgroundColor: "#00c851", // Green call button
    borderRadius: 50,
  },
  uploadButton: {
    marginRight: 10,
    backgroundColor: "#ddd",
    borderRadius: 20,
    padding: 7,
  },
  uploadButtonText: {
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)", // Dark background with transparency
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: "100%",
    height: "80%",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 50,
    padding: 10,
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#000",
  },
  shareLocationButton: {
    marginRight: 4,
    backgroundColor: "#ddd",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  shareLocationText: {
    color: "#fff",
    fontWeight: "bold",
  },
  locationMessage: {
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginVertical: 5,
  },
  locationText: {
    color: "#0F52BA",
    fontSize: 16,
    fontWeight: "bold",
  },
  seenStatus: {
    fontSize: 12,
    color: "gray",
    textAlign: "right",
    marginTop: -15,
    marginRight: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalButton: {
    backgroundColor: "#0b75a7",
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    width: 200,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#D9534F",
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    width: 200,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dateSeparatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dateSeparatorText: {
    marginHorizontal: 10,
    color: "#888",
  },
  messageTime: {
    fontSize: 11,
    color: "#BBB",
    marginLeft: 10,
    textAlign: "right",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flexDirection: "row",
    width: 350,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 30,
  },
  modalButton: {
    flexDirection: "col",
    alignItems: "center",
    marginVertical: 10,
  },
  modalButtonText: {
    fontSize: 16,
    marginRight: 8,
    color: "#333",
    fontWeight: 500,
  },
  reactionsContainer: {
    flexDirection: "row",
    marginTop: 5,
  },
  reaction: {
    fontSize: 16,
    marginHorizontal: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  reactionPicker: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
  },
});
