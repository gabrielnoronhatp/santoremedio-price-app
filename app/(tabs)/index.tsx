import React, { useState, useEffect } from "react";
import {
  Image,
  StyleSheet,
  TextInput,
  View,
  Button,
  Alert,
} from "react-native";
import { Camera, CameraView } from "expo-camera"; 
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from '@react-navigation/stack';




export type RootStackParamList = {
  Home: undefined;
  explore: { eanList: { competitor: string; ean: string; price: string }[] }; 
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;


export default function HomeScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [ean, setEan] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<string>("Drogasil");
  const [scanned, setScanned] = useState(false);

  const [eanList, setEanList] = useState<{ competitor: string; ean: string; price: string }[]>([]);

  const navigation = useNavigation<HomeScreenNavigationProp>();




  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const onBarcodeRead = ({ type, data }: { type: string; data: string }) => {
    console.log("Código de barras lido:", data);
    setEan(data); 
    setScanning(false); 
  };

  if (hasPermission === null) {
    return (
      <ThemedText type="subtitle">Carregando permissão de câmera...</ThemedText>
    );
  }

  if (hasPermission === false) {
    return (
      <ThemedText type="subtitle">
        Permissão para acessar a câmera negada
      </ThemedText>
    );
  }

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    console.log("Código de barras lido:", data); 
    setEan(data); 
    setScanning(false); 

    setEanList(prevList => [
      ...prevList,
      { competitor: selectedStore, ean: data, price: price } 
    ]);
  };

  const navigateToExplore = () => {
    if (eanList.length === 0) {
      Alert.alert("A lista de EANs está vazia.");
    } else {
      navigation.navigate('explore', { eanList }); 
    }
  };
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/grupo-tapajos.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Insira o preço do produto!</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Select a Store:</ThemedText>
        <Picker
          selectedValue={selectedStore}
          onValueChange={(itemValue) => setSelectedStore(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Drogasil" value="Drogasil" />
          <Picker.Item label="Bom Preço" value="Bom Preço" />
          <Picker.Item label="Drogaria" value="Drogaria" />
          <Picker.Item label="Pague Menos" value="Pague Menos" />
        </Picker>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Insira o EAN do produto:</ThemedText>
        <TextInput
          style={styles.input}
          value={ean}
          onChangeText={setEan}
          placeholder="EAN"
          keyboardType="numeric"
        />
        <Button title="Ler código EAN" onPress={() => setScanning(true)} />
      </ThemedView>

      {scanning && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13"],
            }}
          >
            <View style={styles.overlay}>
              <ThemedText type="subtitle">
                Posicione o código de barras no campo
              </ThemedText>
            </View>
          </CameraView>
        </View>
      )}

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Insira o preço do produto:</ThemedText>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="Preço"
          keyboardType="decimal-pad"
        />
      </ThemedView>

      <Button title="Ver lista de EANs" onPress={navigateToExplore} />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 250,
    width: 490,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    paddingLeft: 8,
    marginTop: 8,
    borderRadius: 4,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  camera: {
    width: "100%",
    height: 300,
    borderRadius: 10,
  },
  overlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -100 }, { translateY: -20 }],
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    borderRadius: 5,
  },

  picker: {
    height: 50,
    width: "100%",
    backgroundColor: "#fff",
  },
});
