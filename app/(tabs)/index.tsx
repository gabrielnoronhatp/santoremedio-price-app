import React, { useState, useEffect } from "react";
import {
  Image,
  StyleSheet,
  TextInput,
  View,
  Text,
  Button,
  Alert,
  Pressable,
} from "react-native";
import { Camera, CameraView } from "expo-camera";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import AntDesign from "@expo/vector-icons/AntDesign";

export type RootStackParamList = {
  Home: undefined;
  explore: { eanList: { competitor: string; ean: string; price: string }[] };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

export default function HomeScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [ean, setEan] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<string>("Drogasil");
  const [scanned, setScanned] = useState(false);

  const [eanList, setEanList] = useState<
    { competitor: string; ean: string; price: string }[]
  >([]);

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
    fetchProductByEan(data);
  };

  const fetchProductByEan = async (ean: string) => {
    try {
      const response = await fetch("http://10.2.10.202:5034/api/filtro_por", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          filtros: [
            {
              filtro: "ean",
              valor: ean,
            },
          ],
          page: 1,
          page_size: 24,
        }),
      });

      const data = await response.json();
      console.log("Produtos encontrados:", data);
      if (data && data.length > 0) {
        const newEanList = data.map((product: any) => ({
          competitor: product.tabela,
          ean: product.ean.toString(),
          price: product.preco.toString(), // Convertendo o preço para string
        }));

        // Verifica se o EAN já foi adicionado à lista para evitar duplicatas
        setEanList((prevList) => {
          const updatedList = [...prevList];
          newEanList.forEach((item: any) => {
            if (
              !updatedList.some((existingItem) => existingItem.ean === item.ean)
            ) {
              updatedList.push(item);
            }
          });
          return updatedList;
        });
      } else {
        Alert.alert("Nenhum produto encontrado com esse EAN.");
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      Alert.alert("Erro ao buscar produtos. Tente novamente mais tarde.");
    }
  };

  const handleEanChange = (value: string) => {
    setEan(value);
    if (value.length > 0) {
      fetchProductByEan(value); // Chama a API ao digitar o EAN
    }
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

    setEanList((prevList) => [
      ...prevList,
      { competitor: selectedStore, ean: data, price: price },
    ]);
  };

  const navigateToExplore = () => {
    if (eanList.length === 0) {
      Alert.alert("A lista de EANs está vazia.");
    } else {
      navigation.navigate("explore", { eanList });
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#007933", dark: "#007933" }}
      headerImage={
        <Image
          source={require("@/assets/images/grupo-tapajos.png")}
          style={styles.reactLogo}
        />
      }
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
          <Picker.Item label="Drogaria" value="Drogaria" />
          <Picker.Item label="Pague Menos" value="Pague Menos" />
        </Picker>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Insira o EAN do produto:
        </ThemedText>
        <TextInput
          style={styles.input}
          value={ean}
          onChangeText={handleEanChange}
          placeholder="EAN"
          keyboardType="numeric"
        />

        <Pressable
          style={styles.cameraButton}
          onPress={() => setScanning(true)}
        >
          <AntDesign name="camera" size={24} color="black" />
        </Pressable>
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
              <ThemedText type="subtitle" style={styles.subtitle}>
                Posicione o código de barras no campo
              </ThemedText>
            </View>
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
      <Pressable style={styles.button} onPress={navigateToExplore}>
        <Text style={styles.buttonText}>Confirmar</Text>
      </Pressable>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  reactLogo: {
    height: 250,
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

  subtitle: {
    fontSize: 16,
    marginBottom: 5,
  },
  stepContainer: {
    padding: 20,
  },
  picker: {
    marginVertical: 10,
    height: 50,
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
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 40,
    right: 25,
  },
  cameraIcon: {
    width: 30,
    height: 30,
  },
});
