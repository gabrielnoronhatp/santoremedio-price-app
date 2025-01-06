import React, { useEffect, useState } from "react";
import { StyleSheet, View, TextInput, Button, Alert } from "react-native";
import { useRoute } from "@react-navigation/native";
import { RouteProp } from "@react-navigation/native";
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

import * as Sharing from 'expo-sharing';


import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ParallaxScrollView from "@/components/ParallaxScrollView";

interface Product {
  idprodutoint: number;
  descricao: string;
  marca: string;
  codigoean: string;
}   

export default function TabTwoScreen() {
  const route =
    useRoute<
      RouteProp<
        {
          params: {
            eanList: { competitor: string; ean: string; price: string; productName?: string; brand?: string; location?: { latitude: number; longitude: number; } | null; }[];
          };
        },
        "params"
      >
    >();

  const eanList = route.params?.eanList || [];
  const [sanitizedEanList, setSanitizedEanList] = useState<any[]>([]);
  const [eanInput, setEanInput] = useState<string>("");

  useEffect(() => {
    fetchAndSanitizeData(eanList);
  }, [eanList]);

  const fetchAndSanitizeData = async (list: any[]) => {
    try {
      const response = await fetch('https://price-app-bucket.s3.us-east-1.amazonaws.com/database/database_price.json');
      const products: Product[] = await response.json();

      const sanitizedData = list.map(item => {
        const product = products.find(p => p.codigoean === item.ean);
        return {
          ...item,
          productName: product?.descricao || 'Produto não encontrado',
          brand: product?.marca || ''
        };
      });
      setSanitizedEanList(sanitizedData);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      Alert.alert("Erro ao buscar dados. Tente novamente mais tarde.");
    }
  };

  const handleAddEan = async () => {
    if (!eanInput) {
      Alert.alert("Por favor, insira um EAN.");
      return;
    }

    try {
      const response = await fetch('https://price-app-bucket.s3.us-east-1.amazonaws.com/database/database_price.json');
      const products: Product[] = await response.json();

      const product = products.find(p => p.codigoean === eanInput);

      if (product) {
        const newItem = {
          competitor: "Manual Entry",
          ean: eanInput,
          price: "N/A",
          productName: product.descricao,
          brand: product.marca
        };

        setSanitizedEanList(prevList => [...prevList, newItem]);
        setEanInput(""); // Clear input after adding
      } else {
        Alert.alert("Produto não encontrado na base de dados.");
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      Alert.alert("Erro ao buscar dados. Tente novamente mais tarde.");
    }
  };

  const convertToCSV = (data: any[]) => {
    const headers = ['Localization', 'Concorrente', 'IDProduto', 'PreçoColetado', 'NomeProduto', 'Marca'];
    
    const rows = data.map(item => [
      item.location ? `${item.location.latitude},${item.location.longitude}` : "N/A",
      item.competitor || "N/A",
      item.ean || "N/A",
      item.price || "N/A",
      item.productName || "N/A",
      item.brand || "N/A"
    ]);
  
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');
  
    return csvContent;
  };
  
  // Função para compartilhar o CSV
  const exportToCSV = async (sanitizedEanList: any[]) => {
    try {
      if (sanitizedEanList.length === 0) {
        Alert.alert("Aviso", "Não há dados para exportar!");
        return;
      }
  
      // Converte os dados para CSV
      const csvContent = convertToCSV(sanitizedEanList);
  
      // Define o caminho do arquivo
      const fileName = "eanList.csv";
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  
      // Salva o arquivo localmente
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
  
      // Verifica se o compartilhamento está disponível
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert("Erro", "Compartilhamento não está disponível neste dispositivo.");
        return;
      }
  
      // Compartilha o arquivo CSV
      await Sharing.shareAsync(fileUri);
  
    } catch (error) {
      console.error("Erro ao compartilhar CSV:", error);
      Alert.alert("Erro", "Não foi possível compartilhar o arquivo CSV.");
    }
  };
  

  return (
    <ParallaxScrollView
      headerImage={require('@/assets/images/react-logo.png')}
      headerBackgroundColor={{ dark: '#007933', light: '#007933' }}
    >
      
      <Button title="Exportar para CSV" onPress={() => exportToCSV(sanitizedEanList)} />

      {sanitizedEanList.map((item, index) => (
        <ThemedView key={index} style={styles.itemContainer}>
          <ThemedText>Produto: {item.productName}</ThemedText>
          <ThemedText>Marca: {item.brand}</ThemedText>
          <ThemedText>Concorrente: {item.competitor}</ThemedText>
          <ThemedText>EAN: {item.ean}</ThemedText>
          <ThemedText>Preço: R$ {item.price}</ThemedText>
        </ThemedView>
      ))}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});
