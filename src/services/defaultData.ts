import { Commercant, StockProduit } from '../types';

export const DEFAULT_COMMERCANTS: Commercant[] = [
  { nom: 'Amadou Diallo', boutique: 'Boutique Nassourou', telephone: '+221 77 123 45 67' },
  { nom: 'Fatou Bamba', boutique: 'Établissement Bamba & Frères', telephone: '+225 07 89 12 34' },
  { nom: 'Moussa Traoré', boutique: 'Alimentation Générale Espoir', telephone: '+223 66 45 78 90' },
  { nom: 'Aïssatou Koné', boutique: 'Comptoir Mandingue', telephone: '+224 62 11 22 33' },
  { nom: 'Ibrahim Ouedraogo', boutique: 'Quincaillerie du Marché', telephone: '+226 70 23 45 67' },
  { nom: 'Cheikh Ndiaye', boutique: 'Dépôt Central Cheikh', telephone: '+221 78 987 65 43' }
];

export const DEFAULT_STOCK_PRODUITS: StockProduit[] = [
  { nom: 'Riz Parfumé 25kg (Sac)', stockRestant: 35, prixVente: 18500, prixAchat: 16000, unite: 'Sac' },
  { nom: 'Huile Végétale 5L (Bidon)', stockRestant: 22, prixVente: 6500, prixAchat: 5500, unite: 'Bidon' },
  { nom: 'Sucre Blanc en Morceaux 1kg (Paquet)', stockRestant: 60, prixVente: 950, prixAchat: 800, unite: 'Paquet' },
  { nom: 'Lait Concentré Sucré 1kg (Boîte)', stockRestant: 48, prixVente: 1600, prixAchat: 1350, unite: 'Boîte' },
  { nom: 'Savon de Marseille 250g (Carton)', stockRestant: 18, prixVente: 7500, prixAchat: 6200, unite: 'Carton' },
  { nom: 'Farine de Blé Supérieure 50kg', stockRestant: 12, prixVente: 23000, prixAchat: 20500, unite: 'Sac' },
  { nom: 'Café soluble 200g (Bocal)', stockRestant: 15, prixVente: 2400, prixAchat: 2000, unite: 'Bocal' },
  { nom: 'Tomate Concentrée 2.2kg (Boîte)', stockRestant: 8, prixVente: 3200, prixAchat: 2700, unite: 'Boîte' },
  // Produit épuisé (stock = 0) pour prouver qu'il n'apparaît PAS dans le formulaire des ventes !
  { nom: 'Pâtes Alimentaires 500g (Carton)', stockRestant: 0, prixVente: 4500, prixAchat: 3800, unite: 'Carton' },
  { nom: 'Eau Minérale 10L (Pack)', stockRestant: -2, prixVente: 2200, prixAchat: 1800, unite: 'Pack' },
];

export const POPULAR_EXPENSE_MOTIFS = [
  'Transport marchandises',
  'Carburant livraison',
  'Électricité & Climatisation',
  'Facture d\'eau',
  'Loyer boutique / Dépôt',
  'Emballages & Sachets',
  'Restauration équipe',
  'Communication & Connexion Internet',
  'Manutention / Déchargement',
  'Entretien & Nettoyage',
  'Fournitures de bureau / Carnets'
];
