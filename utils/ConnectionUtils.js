import AsyncStorage from "@react-native-async-storage/async-storage";

const CONNECTION_STATUS_KEY = "isConnected";

export const saveConnectionStatus = async (isConnected) => {
  try {
    await AsyncStorage.setItem(
      CONNECTION_STATUS_KEY,
      JSON.stringify(isConnected)
    );
  } catch (error) {
    console.error(
      "Error saving connection status:",
      error.message,
      error.stack
    );
  }
};

export const getConnectionStatus = async () => {
  try {
    const status = await AsyncStorage.getItem(CONNECTION_STATUS_KEY);
    if (status === null) return false;
    const parsedStatus = JSON.parse(status);
    return typeof parsedStatus === "boolean" ? parsedStatus : false;
  } catch (error) {
    console.error(
      "Error retrieving connection status:",
      error.message,
      error.stack
    );
    return false;
  }
};
