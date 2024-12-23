import { StyleSheet, Image, Platform } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';

export default function TabTwoScreen() {
  const route = useRoute<RouteProp<{ params: { eanList: { competitor: string; ean: string; price: string }[] } }, 'params'>>();
  
  // Verificação de segurança para evitar erro ao acessar eanList
  const eanList = route.params?.eanList || [];  

  const sanitizeData = (item: any) => {
    const validItem: any = {};
    for (const key in item) {
      if (item[key] !== undefined && item[key] !== null && !isNaN(item[key])) {
        validItem[key] = item[key];
      }
    }

    return validItem;
  };
  
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
        <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Lista de EANs</ThemedText>
      </ThemedView>
      {eanList.map((item, index) => {
        const validItem = sanitizeData(item); // Filtra o item para remover valores inválidos

        return (
          <ThemedView key={index} style={styles.itemContainer}>
            {validItem.competitor && <ThemedText>Concorrente: {validItem.competitor}</ThemedText>}
            {validItem.ean && <ThemedText>EAN: {validItem.ean}</ThemedText>}
            {validItem.price && <ThemedText>Preço: {validItem.price}</ThemedText>}
          </ThemedView>
        );
      })}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  itemContainer: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
});
