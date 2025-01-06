import React, { useState, useEffect } from "react";
import {
  Image,
  StyleSheet,
  TextInput,
  View,
  Text,
  Alert,
  Pressable,
} from "react-native";
import { Camera, CameraView } from "expo-camera";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Picker } from "@react-native-picker/picker";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import "react-native-get-random-values";
import * as Location from 'expo-location';
import FontAwesome from "@expo/vector-icons/FontAwesome";

import AsyncStorage from '@react-native-async-storage/async-storage';


type RootStackParamList = {
  explore: { eanList: { competitor: string; ean: string; price: string; productName?: string; brand?: string; location?: { latitude: number; longitude: number; } | null; }[] };
};

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [ean, setEan] = useState<string>("");
  const [price, setPrice] = useState<string>("")
  const [selectedStore, setSelectedStore] = useState<string>("Drogasil");

  const [eanList, setEanList] = useState<
    { competitor: string; ean: string; price: string }[]
  >([]);


  const [searchParameter, setSearchParameter] = useState<string>("ean");
  const [searchValue, setSearchValue] = useState<string>("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);


  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");

    
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Permissão de localização negada');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      // Load saved eanList from AsyncStorage
      const savedEanList = await AsyncStorage.getItem('eanList');
      if (savedEanList) {
        setEanList(JSON.parse(savedEanList));
      }
    })();
  }, []);

  const saveEanList = async (list: any[]) => {
    try {
      await AsyncStorage.setItem('eanList', JSON.stringify(list));
    } catch (error) {
      console.error("Erro ao salvar a lista:", error);
    }
  };

  const handleAddToEanList = (newItem: any) => {
    const updatedList = [...eanList, newItem];
    setEanList(updatedList);
    saveEanList(updatedList);
  };

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    console.log("Código de barras lido:", data);
    setEan(data);
    setScanning(false);
    setSearchValue(data); 
    setScanning(false); 

    setEanList((prevList) => [
      ...prevList,
      { competitor: selectedStore, ean: data, price: price },
    ]);
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(
        "https://price-app-bucket.s3.us-east-1.amazonaws.com/database/database_price.json"
      );
      const data = await response.json();

      let product;
      if (searchParameter === "idprodutoint") {
        product = data.find(
          (item: any) => item[searchParameter] === parseInt(searchValue)
        );
      } else if (
        searchParameter === "descricao" ||
        searchParameter === "marca"
      ) {
        product = data.find((item: any) =>
          item[searchParameter]
            .toLowerCase()
            .includes(searchValue.toLowerCase())
        );
      } else {
        product = data.find((item: any) => item.codigoean === searchValue);
      }

      if (product) {
        Alert.alert(
          "Produto encontrado",
          `ID: ${product.idprodutoint}\nDescrição: ${product.descricao}\nMarca: ${product.marca}\nEAN: ${product.codigoean}`,
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Adicionar à lista",
              onPress: () => {
                if (price) {
                  const newItem = {
                    competitor: selectedStore,
                    ean: product.codigoean,
                    price: price,
                    productName: product.descricao,
                    brand: product.marca,
                    location: location,
                  };
                  handleAddToEanList(newItem);

                  navigation.navigate("explore", {
                    eanList: [...eanList, newItem],
                  });

                  setPrice("");
                  setSearchValue("");
                } else {
                  Alert.alert("Aviso", "Por favor, insira um preço antes de adicionar à lista");
                }
              },
            },
          ]
        );
      } else {
        Alert.alert("Aviso", "Produto não encontrado");
      }
    } catch (error) {
      console.error("Erro na busca:", error);
      Alert.alert("Erro", "Ocorreu um erro ao buscar o produto");
    }
  };

  const handleConfirm = () => {
    if (!searchValue || !price) {
      Alert.alert("Aviso", "Por favor, preencha o código do produto e o preço");
      return;
    }

    navigation.navigate("explore", {
      eanList: [
        ...eanList,
        {
          competitor: selectedStore,
          ean: searchValue,
          price: price,
          location: location,
        },
      ],
    });

    setPrice("");
    setSearchValue("");
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#007933", dark: "#007933" }}
      headerImage={require("@/assets/images/react-logo.png")}
    >
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Selecione a loja:
        </ThemedText>
        <Picker
          selectedValue={selectedStore}
          onValueChange={(itemValue) => setSelectedStore(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Drogasil" value="Drogasil" />
          <Picker.Item label="Bom Preço" value="Bom Preço" />
          <Picker.Item label="Pague Menos" value="Pague Menos" />
          <Picker.Item label="Independente" value="Independente" />
        </Picker>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
    
        <View style={styles.radioContainer}>
          {[
            { label: "ID", value: "idprodutoint" },
            { label: "Descrição", value: "descricao" },
            { label: "Marca", value: "marca" },
            { label: "EAN", value: "codigoean" },
          ].map((param) => (
            <Pressable
              key={param.value}
              style={styles.radioButton}
              onPress={() => setSearchParameter(param.value)}
            >
              <Text style={styles.radioText}>{param.label}</Text>
              {searchParameter === param.value && (
                <View style={styles.radioSelected} />
              )}
            </Pressable>
          ))}
        </View>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Insira o valor de busca:
        </ThemedText>
        <View style={styles.searchContainer}>
          <TextInput
            onChangeText={setSearchValue}
            style={[styles.input, { flex: 1 }]}
            value={searchValue}
            placeholder={`Digite o Parâmetro de Busca`}
          />
          {searchParameter === "codigoean" && (
            <Pressable 
              style={styles.cameraButton}
              onPress={() => setScanning(true)}
            >
              <FontAwesome name="camera" size={20} color="white" />
            </Pressable>
          )}
          <Pressable style={styles.searchButton} onPress={handleSearch}>
            <FontAwesome name="search" size={16} color="white" />
          </Pressable>
        </View>
      </ThemedView>

      {scanning && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13"],
            }}
          >
            <Pressable 
              style={styles.closeButton}
              onPress={() => setScanning(false)}
            >
              <FontAwesome name="close" size={24} color="white" />
            </Pressable>
          </CameraView>
        </View>
      )}

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Insira o preço do produto:
        </ThemedText>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="Preço"
          keyboardType="decimal-pad"
        />
      </ThemedView>
      <Pressable style={styles.button} onPress={handleConfirm}>
        <Text style={styles.buttonText}>Confirmar</Text>
      </Pressable>
    </ParallaxScrollView>
  );
}



const styles = StyleSheet.create({
  reactLogo: {
    height: 300,
    width: 490,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
  cameraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  camera: {
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 5,
  },
  stepContainer: {
    padding: 20,
  },
  picker: {
    marginVertical: 10,
    height: 60,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
    fontSize: 16,
    width: "100%",
  },
  button: {
    backgroundColor: "#007933",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 20,
  },
  cameraButton: {
    backgroundColor: "#007933",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIcon: {
    width: 30,
    height: 30,
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioText: {
    marginRight: 5,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007933",
  },
  selectButton: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchButton: {
    backgroundColor: "#007933",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
  },
});