import React from "react";
import { View, StyleSheet } from "react-native";
import Pdf from "react-native-pdf";

const PDFViewer = ({ fileUrl }) => {
  return (
    <View style={styles.container}>
      <Pdf
        source={{ uri: fileUrl }}
        style={styles.pdf}
        onError={(error) => console.log("PDF Error:", error)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pdf: {
    flex: 1,
    width: "100%",
  },
});

export default PDFViewer;
