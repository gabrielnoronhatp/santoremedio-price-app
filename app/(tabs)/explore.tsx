import React, { useEffect, useState } from "react";
import { StyleSheet, Alert, TouchableOpacity } from "react-native";
import { useRoute } from "@react-navigation/native";
import { RouteProp } from "@react-navigation/native";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ThemedText } from "components/ThemedText";
import { ThemedView } from "components/ThemedView";
import ParallaxScrollView from "components/ParallaxScrollView";
import { FontAwesome } from '@expo/vector-icons';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as Device from 'expo-device';

interface Product {
  idprodutoint: number;
  descricao: string;
  marca: string;
  codigoean: string;
}   

const formatCurrency = (value: string) => {
  let numbers = value.replace(/\D/g, '');
  let formatted = (Number(numbers) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return formatted;
};

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
  const [productCache, setProductCache] = useState<Record<string, Product>>({});

  useEffect(() => {
    fetchAndSanitizeData(eanList);
  }, [eanList]);

  const fetchAndSanitizeData = async (list: any[]) => {
    try {
      if (Object.keys(productCache).length === 0) {
        const response = await fetch('https://price-app-bucket.s3.us-east-1.amazonaws.com/database/database_price.json');
        const products: Product[] = await response.json();
        
        const cache: Record<string, Product> = {};
        products.forEach(product => {
          cache[product.codigoean] = product;
        });
        setProductCache(cache);
      }

      const sanitizedData = list.map(item => ({
        ...item,
        productName: productCache[item.ean]?.descricao || 'Produto não encontrado',
        brand: productCache[item.ean]?.marca || ''
      }));
      
      setSanitizedEanList(sanitizedData);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      Alert.alert("Erro ao buscar dados. Tente novamente mais tarde.");
    }
  };

  const convertToCSV = (data: any[]) => {
    const headers = ['Localization', 'Concorrente', 'IDProduto', 'PrecoColetado', 'NomeProduto', 'Marca'];
    
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

  const uploadToS3 = async (data: any) => {
    const deviceName = Device.deviceName || "unknown_device";
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${deviceName}_${timestamp}.json`;

    const s3Client = new S3Client({
      region: "us-east-1", 
      credentials: {
        accessKeyId: "AKIAYLYIABHP5ULXZ2HA", 
        secretAccessKey: "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", 
      },
    });

    const params = {
      Bucket: "price-app-bucket", 
      Key: fileName,
      Body: JSON.stringify(data),
      ContentType: "application/json",
    };

    try {
      await s3Client.send(new PutObjectCommand(params));
      Alert.alert("Sucesso", "Dados enviados com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar Dados:", error);
      Alert.alert("Erro", "Não foi possível enviar os dados .");
    }
  };

  const exportToCSV = async (sanitizedEanList: any[]) => {
    try {
      if (sanitizedEanList.length === 0) {
        Alert.alert("Aviso", "Não há dados para exportar!");
        return;
      }
  
      const csvContent = convertToCSV(sanitizedEanList);
  
      const deviceName = Device.deviceName || "unknown_device";
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${deviceName}_${timestamp}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
  
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert("Erro", "Compartilhamento não está disponível neste dispositivo.");
        return;
      }
  
      await Sharing.shareAsync(fileUri);

      // Upload to S3
      await uploadToS3(sanitizedEanList);

    } catch (error) {
      console.error("Erro ao compartilhar CSV:", error);
      Alert.alert("Erro", "Não foi possível compartilhar o arquivo CSV.");
    }
  };

  return (
    <>
      <ParallaxScrollView
        headerImage={require('assets/images/react-logo.png')}
        headerBackgroundColor={{ dark: '#007933', light: '#007933' }}
      >
        {sanitizedEanList.map((item, index) => (
          <ThemedView key={index} style={styles.itemContainer}>
            <ThemedText>Produto: {item.productName}</ThemedText>
            <ThemedText>Marca: {item.brand}</ThemedText>
            <ThemedText>Concorrente: {item.competitor}</ThemedText>
            <ThemedText>EAN: {item.ean}</ThemedText>
            <ThemedText>Preco: {formatCurrency(item.price)}</ThemedText>
          </ThemedView>
        ))}
      </ParallaxScrollView>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => exportToCSV(sanitizedEanList)}
      >
        <FontAwesome name="file-text-o" size={24} color="white" />
      </TouchableOpacity>
    </>
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
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#007933',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
