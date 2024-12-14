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
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import firebase from "../Config";
import * as DocumentPicker from "expo-document-picker"; // For file selection
import { SafeAreaView } from "react-native-safe-area-context";

const reflesdiscussions = firebase.database().ref("TheDiscussions");

export default function Chat(props) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false); // Track upload status

  const profile = props.route.params.profile;
  const userId = firebase.auth().currentUser.uid;
  const iddisc =
    userId > profile.id ? userId + profile.id : profile.id + userId;
  const ref_unediscussion = reflesdiscussions.child(iddisc);

  useEffect(() => {
    ref_unediscussion.on("value", (snapshot) => {
      const fetchedMessages = [];
      snapshot.forEach((child) => {
        if (child.key !== "typing") {
          fetchedMessages.push(child.val());
        }
      });

      const processedMessages = addDateSeparators(fetchedMessages.reverse());
      setMessages(processedMessages);
    });

    ref_unediscussion.child("typing").on("value", (snapshot) => {
      if (snapshot.val() && snapshot.val() !== userId) {
        setIsTyping(true);
      } else {
        setIsTyping(false);
      }
    });

    return () => ref_unediscussion.off();
  }, []);

  const addDateSeparators = (messages) => {
    const result = [];
    let lastDate = null;

    messages.forEach((message) => {
      const currentDate = new Date(message.date).toDateString();
      if (currentDate !== lastDate) {
        result.push({ type: "date", date: currentDate });
        lastDate = currentDate;
      }
      result.push(message);
    });

    return result;
  };

  const handleInputChange = (text) => {
    setInputText(text);
    ref_unediscussion.child("typing").set(text ? userId : null);
  };

  const sendMessage = (fileUrl = null) => {
    if (!inputText.trim() && !fileUrl) return;

    const newMessage = {
      id: Date.now().toString(),
      text: fileUrl ? "📎 File" : inputText,
      fileUrl, // Add file URL to the message if present
      sender: userId,
      date: new Date().toISOString(),
      receiver: profile.id,
    };

    const key = ref_unediscussion.push().key;
    const ref_unediscussion_key = ref_unediscussion.child(key);
    ref_unediscussion_key
      .set(newMessage)
      .then(() => {
        ref_unediscussion.child("typing").set(null);
        setInputText("");
        if (fileUrl) {
          Alert.alert("Success", "File uploaded and sent successfully!");
        }
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        Alert.alert("Error", "Failed to send the message.");
      });
  };

  const pickAndUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Allow all file types
      });

      if (result.type === "success") {
        setUploading(true);
        Alert.alert("Info", "Uploading file...");

        const fileUri = result.uri;
        const fileName = result.name;
        const storageRef = firebase.storage().ref(`chat_files/${fileName}`);
        const response = await fetch(fileUri);
        const blob = await response.blob();

        // Upload file to Firebase Storage
        const uploadTask = storageRef.put(blob);
        uploadTask.on(
          "state_changed",
          null,
          (error) => {
            setUploading(false);
            console.error("Upload error:", error);
            Alert.alert("Error", "Failed to upload file.");
          },
          async () => {
            const fileUrl = await storageRef.getDownloadURL();
            setUploading(false);
            sendMessage(fileUrl); // Send file URL as a message
          }
        );
      }
    } catch (error) {
      console.error("File selection error:", error);
      Alert.alert("Error", "Failed to select a file.");
    }
  };

  const renderMessage = ({ item }) => {
    if (item.type === "date") {
      return <Text style={styles.dateHeader}>{item.date}</Text>;
    }

    const isMe = item.sender === userId;
    const formattedTime = new Date(item.date).toLocaleTimeString();

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isMe ? styles.myMessage : styles.otherMessage,
        ]}
      >
        {item.fileUrl ? (
          item.fileUrl.match(/\.(jpeg|jpg|png|gif)$/i) ? (
            <Image source={{ uri: item.fileUrl }} style={styles.imagePreview} />
          ) : (
            <Text style={[styles.messageText, styles.fileText]}>
              📎 File: {item.text}
            </Text>
          )
        ) : (
          <Text style={styles.messageText}>{item.text}</Text>
        )}
        <Text style={styles.timestamp}>{formattedTime}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={
            profile.profileImage
              ? { uri: profile.profileImage }
              : require("../assets/profil.png")
          }
          style={styles.profileImage}
        />
        <Text style={styles.headerText}>
          {profile.pseudo} {profile.nom}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flexGrow}
      >
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) =>
            item.type === "date" ? `date-${index}` : item.id
          }
          contentContainerStyle={styles.messagesList}
          inverted
        />
        {isTyping && <Text style={styles.typingIndicator}>Typing...</Text>}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={handleInputChange}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={inputText ? sendMessage : null}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={pickAndUploadFile}
          >
            <Text style={styles.sendButtonText}>📎</Text>
          </TouchableOpacity>
        </View>
        {uploading && <ActivityIndicator size="small" color="#0F52BA" />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  dateHeader: {
    alignSelf: "center",
    marginVertical: 10,
    fontSize: 14,
    color: "gray",
    fontWeight: "bold",
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
  fileText: {
    color: "#fff",
    fontStyle: "italic",
  },
  timestamp: {
    fontSize: 10,
    color: "#ccc",
    alignSelf: "flex-end",
    marginTop: 5,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
    backgroundColor: "#fff",
  },
  sendButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F52BA",
    borderRadius: 20,
    padding: 10,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "#fff",
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
    resizeMode: "cover",
  },
  typingIndicator: {
    alignSelf: "center",
    fontSize: 14,
    color: "gray",
    marginVertical: 5,
  },
});
