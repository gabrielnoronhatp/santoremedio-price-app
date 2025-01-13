import React, { useState, useEffect, useMemo } from "react";
import {
  Image,
  StyleSheet,
  TextInput,
  View,
  Text,
  Alert,
  Pressable,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Camera, CameraView } from "expo-camera";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Picker } from "@react-native-picker/picker";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import "react-native-get-random-values";
import * as Location from "expo-location";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { debounce, memoize } from "lodash";

import AsyncStorage from "@react-native-async-storage/async-storage";

type RootStackParamList = {
  explore: {
    eanList: {
      competitor: string;
      ean: string;
      price: string;
      productName?: string;
      brand?: string;
      location?: { latitude: number; longitude: number } | null;
    }[];
  };
};

// Nova função para buscar dados
async function fetchDatabaseData() {
  try {
    const response = await fetch('https://price-app-bucket.s3.us-east-1.amazonaws.com/database/database_price.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching database:', error);
    throw error;
  }
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [ean, setEan] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<string>("Indepedente");

  const [eanList, setEanList] = useState<
    { competitor: string; ean: string; price: string }[]
  >([]);

  const [searchParameter, setSearchParameter] = useState<string>("idprodutoint  ");
  const [searchValue, setSearchValue] = useState<string>("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [database, setDatabase] = useState<any[]>([]);
  const [indexedDatabase, setIndexedDatabase] = useState<Record<string, any>>(
    {}
  );
  const [isDatabaseLoaded, setIsDatabaseLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [descriptionMap, setDescriptionMap] = useState<Map<string, any>>(new Map());
  const [eanMap, setEanMap] = useState<Map<string, any>>(new Map());
  const [brandMap, setBrandMap] = useState<Map<string, any[]>>(new Map());
  const [idMap, setIdMap] = useState<Map<string, any>>(new Map());
  
   useEffect(() => {
    fetchDatabaseData()
      .then(data => {
        setDatabase(data);
        setIsDatabaseLoaded(true);
      })
      .catch(error => console.error('Error fetching database:', error));
  }, []);

  
  useEffect(() => {
    (async () => {
      setEanList([]);
      await AsyncStorage.removeItem("eanList");

      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");

      const { status: locationStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== "granted") {
        Alert.alert("Permissão de localização negada");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
  

      
      const savedEanList = await AsyncStorage.getItem("eanList");
      if (savedEanList) {
        setEanList(JSON.parse(savedEanList));
      }

      try {
        const parsedData = await fetchDatabaseData();
        console.log('Loaded data size:', parsedData.length); 

        
        const descMap = new Map();
        const eanMap = new Map();
        const brandMap = new Map();
        const idMap = new Map();

        parsedData.forEach((item: any) => {
      
          if (item.descricao) {
            const descKey = item.descricao.toLowerCase();
            descMap.set(descKey, item);
          }
          
         
          if (item.codigoean) {
            eanMap.set(item.codigoean, item);
          }

  
          if (item.marca) {
            const brandKey = item.marca.toLowerCase();
            if (!brandMap.has(brandKey)) {
              brandMap.set(brandKey, []);
            }
            brandMap.get(brandKey).push(item);
          }

          if (item.idprodutoint) {
            idMap.set(item.idprodutoint.toString(), item);
          }
        });

     

        setDescriptionMap(descMap);
        setEanMap(eanMap);
        setBrandMap(brandMap);
        setIdMap(idMap);
        setDatabase(parsedData);
        setIsDatabaseLoaded(true);
      } catch (error) {
        console.error("Error loading database:", error);
        setIsDatabaseLoaded(false);
      }
    })();
  }, []);

  const saveEanList = async (list: any[]) => {
    try {
      await AsyncStorage.setItem("eanList", JSON.stringify(list));
    } catch (error) {
      console.error("Erro ao salvar a lista:", error);
    }
  };



  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
  
    setEan(data);
    setScanning(false);
    setSearchValue(data);
  };

  const handleSearchValueChange = (text: string) => {
    setSearchValue(text);
    setEan("");
    updateSuggestions(text);
  };

  const updateSuggestions = debounce((text: string) => {
    if (!text || text.length < 1) {
      setSuggestions([]);
      return;
    }
  
    const searchTerms = text.toLowerCase().trim().split(/\s+/);
    let results: string[] = [];
  
    try {
      switch (searchParameter) {
        case "descricao":
          results = Array.from(descriptionMap.keys())
            .filter(key => searchTerms.every(term => key.includes(term))) 
            .map(key => descriptionMap.get(key).descricao)
            .slice(0, 10);
          break;
  
        case "marca":
          results = Array.from(brandMap.keys())
            .filter(key => key.includes(searchTerms[0])) 
            .map(key => brandMap.get(key)?.[0]?.marca || "")
            .slice(0, 10);
          break;
  
        case "codigoean":
          results = Array.from(eanMap.keys())
            .filter(key => key.startsWith(searchTerms[0])) 
            .slice(0, 10);
          break;
  
        case "idprodutoint":
          results = Array.from(idMap.keys())
            .filter(key => key.startsWith(searchTerms[0])) 
            .slice(0, 10);
          break;
      }
  
      setSuggestions(results);
    } catch (error) {
      console.error("Error in updateSuggestions:", error);
      setSuggestions([]);
    }
  }, 300, { leading: false, trailing: true });
  

  const [isSearching, setIsSearching] = useState(false);

  const memoizedSearch = useMemo(() => {
    return memoize((searchValue: string) => {
      if (!searchValue) return null;

      switch (searchParameter) {
        case "descricao":
          const searchWords = searchValue.toLowerCase().split(' ').filter(word => word.length > 0);
          const matchingKeys = Array.from(descriptionMap.keys())
            .filter(key => searchWords.every(word => key.includes(word)));
          return matchingKeys.length > 0 ? descriptionMap.get(matchingKeys[0]) : null;
        
        case "codigoean":
          return eanMap.get(searchValue);
        
        case "marca":
          const brandResults = brandMap.get(searchValue.toLowerCase());
          return brandResults?.[0] || null;
        
        case "idprodutoint":
          return idMap.get(searchValue);
        
        default:
          return null;
      }
    });
  }, [descriptionMap, eanMap, brandMap, idMap, searchParameter]);

  const handleSearch = debounce(async () => {
    if (!searchValue) {
      Alert.alert("Aviso", "Por favor, preencha o parâmetro de busca");
      return;
    }

    setIsSearching(true);
    try {
      const product = memoizedSearch(searchValue);

      if (product) {
        Alert.alert("Produto encontrado", `Produto: ${product.descricao}`);
      } else {
        Alert.alert("Aviso", "Produto não encontrado");
      }
    } catch (error) {
      console.error("Erro na busca:", error);
      Alert.alert("Erro", "Ocorreu um erro ao buscar o produto");
    } finally {
      setIsSearching(false);
    }
  }, 300);

  const handleConfirm = () => {
    if (!searchValue || !price || !selectedStore) {
      Alert.alert(
        "Aviso",
        "Por favor, preencha todos os campos obrigatórios: código do produto, preço e loja"
      );
      return;
    }

    const product = memoizedSearch(searchValue);

    if (product) {
      Alert.alert("Confirmação", "Deseja adicionar este produto à lista?", [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          onPress: () => {
            const formattedPrice = formatCurrency(price);
            const newItem = {
              competitor: selectedStore,
              ean: product.codigoean,
              price: formattedPrice,
              productName: product.descricao,
              brand: product.marca,
              location: location,
            };

            setEanList((prevList) => [...prevList, newItem]);
            saveEanList([...eanList, newItem]);

            navigation.navigate("explore", {
              eanList: [...eanList, newItem],
            });

            setPrice("");
            setSearchValue("");
          },
        },
      ]);
    } else {
      Alert.alert("Aviso", "Produto não encontrado");
    }
  };

  const formatCurrency = (value: string) => {
    let numbers = value.replace(/\D/g, "");
    let formatted = (Number(numbers) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    return formatted;
  };

  const handlePriceChange = (text: string) => {
    const numericValue = text.replace(/\D/g, "");
    setPrice(numericValue);
  };

  return (
    <View style={{ marginTop: 100 }}>
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
          <View style={styles.autocompleteContainer}>
            <TextInput
              style={styles.input}
              value={searchValue}
              onChangeText={handleSearchValueChange}
              editable={!isSearching}
              placeholder="Digite aqui..."
            />

            {suggestions.length > 0 && (
              <View style={styles.suggestionsWrapper}>
                
                  <FlatList
                  data={suggestions}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => {
                        setSearchValue(item);
                        setSuggestions([]);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  style={styles.suggestionsContainer}
                  contentContainerStyle={styles.suggestionsContentContainer}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                />
              </View>
            )}
          </View>
          {searchParameter === "codigoean" && (
            <Pressable
              style={styles.cameraButton}
              onPress={() => setScanning(true)}
            >
              <FontAwesome name="camera" size={20} color="white" />
            </Pressable>
          )}
          <Pressable
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={!isDatabaseLoaded}
          >
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
              barcodeTypes: ["ean13", "ean8"],
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
          Insira o preço:
        </ThemedText>
        <TextInput
          style={styles.input}
          value={price ? formatCurrency(price) : ""}
          onChangeText={handlePriceChange}
          placeholder="R$ 0,00"
          keyboardType="numeric"
        />
      </ThemedView>
      <Pressable style={styles.button} onPress={handleConfirm}>
        <Text style={styles.buttonText}>Confirmar</Text>
      </Pressable>
    </View>
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
    position: "absolute",
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
    color: "#007933",
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
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 10,
  },
  autocompleteContainer: {
    flex: 1,
    position: "relative",
  },
  suggestionsWrapper: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionsContainer: {
    flex: 1,
  },
  suggestionsContentContainer: {
    flexGrow: 1,
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
});
