export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * APPLICATION DE COLLECTE DE DONNÉES COMMERCIALES - GOOGLE APPS SCRIPT
 * Version 3.0 - Synchronisation Bidirectionnelle Complète & Anti-Doublons
 * =========================================================================
 * Ce script relie votre application web à votre classeur Google Sheets.
 * Il assure la synchronisation DANS LES DEUX SENS :
 *   1. Application -> Google Sheets : Enregistre chaque formulaire à la suite (appendRow)
 *   2. Google Sheets -> Application : Renvoie les commerçants modifiés/ajoutés et les stocks > 0
 * 
 * ONGLETS UTILISÉS (respect strict des noms exacts) :
 * 1. "les vents"           -> Enregistrement des ventes
 * 2. "les produit"         -> Enregistrement des achats / nouveaux produits
 * 3. "les depence"         -> Enregistrement des dépenses
 * 4. "les factur"          -> Enregistrement des réceptions / factures
 * 5. "liste_commercants"   -> Enregistrement et liste des commerçants
 * 6. "stock"               -> Source pour le stock disponible (> 0)
 * =========================================================================
 */

// Configuration stricte des noms d'onglets
var CONFIG = {
  SHEET_VENTES: "les vents",
  SHEET_PRODUITS: "les produit",
  SHEET_DEPENSES: "les depence",
  SHEET_FACTURES: "les factur",
  SHEET_COMMERCANTS: "liste_commercants",
  SHEET_COMMERCANTS_ALT: "LISTE_COMMERCANTS",
  SHEET_STOCK: "stock"
};

/**
 * Traitement des requêtes GET (Google Sheets -> Application) :
 * Récupère en temps réel les commerçants, les stocks > 0, et l'état des feuilles.
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getData";

    // 1. Récupération des commerçants (depuis liste_commercants ou LISTE_COMMERCANTS)
    var commercants = getCommercantsList(ss);

    // 2. Récupération des produits avec stock restant STRICTEMENT > 0
    var produitsEnStock = getStockProduits(ss);

    // 3. Récupération de tous les produits référencés (avec prix)
    var tousLesProduits = getAllProduitsNames(ss);

    // 4. État et nombre de lignes des 5 onglets
    var sheetsVerifiees = {};
    for (var k in CONFIG) {
      var sName = CONFIG[k];
      var sObj = ss.getSheetByName(sName);
      sheetsVerifiees[sName] = sObj ? {
        existe: true,
        lignes: sObj.getLastRow(),
        colonnes: sObj.getLastColumn()
      } : {
        existe: false,
        lignes: 0,
        colonnes: 0
      };
    }

    var responseData = {
      status: "success",
      version: "3.0",
      action: action,
      timestamp: new Date().toISOString(),
      spreadsheetTitle: ss.getName(),
      commercants: commercants,
      produitsEnStock: produitsEnStock,
      tousLesProduits: tousLesProduits,
      sheets: sheetsVerifiees,
      resume: {
        totalCommercants: commercants.length,
        totalProduitsEnStock: produitsEnStock.length,
        totalProduitsReferences: tousLesProduits.length
      }
    };

    return createOutput(e, responseData);

  } catch (error) {
    var errorData = {
      status: "error",
      version: "3.0",
      message: error.toString()
    };
    return createOutput(e, errorData);
  }
}

/**
 * Helper de sortie avec support direct JSON et JSONP (évite tout blocage CORS)
 */
function createOutput(e, data) {
  var callback = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : null;
  var jsonString = JSON.stringify(data);

  if (callback) {
    return ContentService.createTextOutput(callback + "(" + jsonString + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Traitement des requêtes POST (Application -> Google Sheets) :
 * Enregistre chaque formulaire sur une nouvelle ligne (appendRow)
 * Protège contre les doublons lors des nouvelles tentatives de synchronisation.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  // Verrouillage de 30 secondes pour garantir l'atomicité et éviter les collisions simultanées
  lock.tryLock(30000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = null;

    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter;
      }
    } else if (e && e.parameter && e.parameter.data) {
      try {
        data = JSON.parse(e.parameter.data);
      } catch (err) {
        data = e.parameter;
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    if (!data) {
      throw new Error("Aucune donnée reçue dans la requête POST");
    }

    // Normalisation du nom de type (insensible casse, accents et tirets)
    var rawType = String(data.formType || data.type || "").toLowerCase().trim();
    var formType = rawType.replace(/ç/g, "c").replace(/[\\s\\-_]/g, "");
    var result = { status: "success" };

    if (formType === "ventes" || formType === "lesvents" || formType === "vente") {
      result = enregistrerVente(ss, data);
    } else if (formType === "produits" || formType === "lesproduit" || formType === "produit") {
      result = enregistrerProduit(ss, data);
    } else if (formType === "depenses" || formType === "lesdepence" || formType === "depense") {
      result = enregistrerDepense(ss, data);
    } else if (formType === "factures" || formType === "lesfactur" || formType === "facture") {
      result = enregistrerFacture(ss, data);
    } else if (formType === "commercants" || formType === "commercant" || formType === "listecommercants") {
      result = enregistrerCommercant(ss, data);
    } else {
      throw new Error("Type de formulaire inconnu : « " + (data.formType || data.type) + " ». Types acceptés : ventes, produits, depenses, factures, commercants.");
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      version: "3.0",
      message: result.message || ("Enregistrement effectué avec succès dans l'onglet " + result.sheet),
      id: result.id,
      sheet: result.sheet,
      duplicateAvoided: Boolean(result.duplicateAvoided),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      version: "3.0",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

/**
 * 1. Enregistrement d'une vente dans « les vents »
 * Colonnes : ID_Vente | Date_Vente | Nom_Commercant | Nom_Produit | Quantite_Vendue | Date_Enregistrement
 */
function enregistrerVente(ss, data) {
  var sheet = getOrCreateSheet(ss, CONFIG.SHEET_VENTES, [
    "ID_Vente", "Date_Vente", "Nom_Commercant", "Nom_Produit", "Quantite_Vendue", "Date_Enregistrement"
  ]);

  var idVente = String(data.idVente || data.ID_Vente || ("VTE-" + new Date().getTime())).trim();

  // Protection anti-doublon lors des réémissions de la file hors-ligne
  var existingRow = findRowIndexById(sheet, 1, idVente);
  if (existingRow > 0) {
    return {
      id: idVente,
      sheet: CONFIG.SHEET_VENTES,
      duplicateAvoided: true,
      message: "Vente " + idVente + " déjà enregistrée dans « les vents » (doublon évité)."
    };
  }

  var row = [
    idVente,
    data.dateVente || data.Date_Vente || Utilities.formatDate(new Date(), "GMT+0", "yyyy-MM-dd"),
    data.nomCommercant || data.Nom_Commercant || "",
    data.nomProduit || data.Nom_Produit || "",
    Number(data.quantiteVendue || data.Quantite_Vendue || 0),
    new Date()
  ];

  sheet.appendRow(row);

  // Décrémenter le stock dans la feuille « stock » si elle existe
  mettreAJourStockApresVente(ss, data.nomProduit || data.Nom_Produit, Number(data.quantiteVendue || data.Quantite_Vendue || 0));

  return { id: row[0], sheet: CONFIG.SHEET_VENTES, duplicateAvoided: false };
}

/**
 * 2. Enregistrement d'un produit dans « les produit »
 * Colonnes : ID_Produit_Achat | Date_Achat | Nom_Produit | Prix_Achat_Unitaire | Prix_Vente_Unitaire | Date_Enregistrement
 */
function enregistrerProduit(ss, data) {
  var sheet = getOrCreateSheet(ss, CONFIG.SHEET_PRODUITS, [
    "ID_Produit_Achat", "Date_Achat", "Nom_Produit", "Prix_Achat_Unitaire", "Prix_Vente_Unitaire", "Date_Enregistrement"
  ]);

  var idProduit = String(data.idProduitAchat || data.ID_Produit_Achat || ("PRD-" + new Date().getTime())).trim();

  // Protection anti-doublon
  var existingRow = findRowIndexById(sheet, 1, idProduit);
  if (existingRow > 0) {
    return {
      id: idProduit,
      sheet: CONFIG.SHEET_PRODUITS,
      duplicateAvoided: true,
      message: "Produit " + idProduit + " déjà enregistré dans « les produit » (doublon évité)."
    };
  }

  var row = [
    idProduit,
    data.dateAchat || data.Date_Achat || Utilities.formatDate(new Date(), "GMT+0", "yyyy-MM-dd"),
    data.nomProduit || data.Nom_Produit || "",
    Number(data.prixAchatUnitaire || data.Prix_Achat_Unitaire || 0),
    Number(data.prixVenteUnitaire || data.Prix_Vente_Unitaire || 0),
    new Date()
  ];

  sheet.appendRow(row);
  return { id: row[0], sheet: CONFIG.SHEET_PRODUITS, duplicateAvoided: false };
}

/**
 * 3. Enregistrement d'une dépense dans « les depence »
 * Colonnes : ID_Depense | Date_Depense | Nom_Commercant | Montant_Depense | Motif_Depense | Date_Enregistrement
 */
function enregistrerDepense(ss, data) {
  var sheet = getOrCreateSheet(ss, CONFIG.SHEET_DEPENSES, [
    "ID_Depense", "Date_Depense", "Nom_Commercant", "Montant_Depense", "Motif_Depense", "Date_Enregistrement"
  ]);

  var idDepense = String(data.idDepense || data.ID_Depense || ("DEP-" + new Date().getTime())).trim();

  // Protection anti-doublon
  var existingRow = findRowIndexById(sheet, 1, idDepense);
  if (existingRow > 0) {
    return {
      id: idDepense,
      sheet: CONFIG.SHEET_DEPENSES,
      duplicateAvoided: true,
      message: "Dépense " + idDepense + " déjà enregistrée dans « les depence » (doublon évité)."
    };
  }

  var row = [
    idDepense,
    data.dateDepense || data.Date_Depense || Utilities.formatDate(new Date(), "GMT+0", "yyyy-MM-dd"),
    data.nomCommercant || data.Nom_Commercant || "",
    Number(data.montantDepense || data.Montant_Depense || 0),
    data.motifDepense || data.Motif_Depense || "",
    new Date()
  ];

  sheet.appendRow(row);
  return { id: row[0], sheet: CONFIG.SHEET_DEPENSES, duplicateAvoided: false };
}

/**
 * 4. Enregistrement d'une facture/reçu dans « les factur »
 * Colonnes : ID_Reception | Date_Reception | Nom_Produit | Quantite_Recue | Prix_Achat_Unitaire | Date_Enregistrement
 */
function enregistrerFacture(ss, data) {
  var sheet = getOrCreateSheet(ss, CONFIG.SHEET_FACTURES, [
    "ID_Reception", "Date_Reception", "Nom_Produit", "Quantite_Recue", "Prix_Achat_Unitaire", "Date_Enregistrement"
  ]);

  var idReception = String(data.idReception || data.ID_Reception || ("FAC-" + new Date().getTime())).trim();

  // Protection anti-doublon
  var existingRow = findRowIndexById(sheet, 1, idReception);
  if (existingRow > 0) {
    return {
      id: idReception,
      sheet: CONFIG.SHEET_FACTURES,
      duplicateAvoided: true,
      message: "Facture " + idReception + " déjà enregistrée dans « les factur » (doublon évité)."
    };
  }

  var row = [
    idReception,
    data.dateReception || data.Date_Reception || Utilities.formatDate(new Date(), "GMT+0", "yyyy-MM-dd"),
    data.nomProduit || data.Nom_Produit || "",
    Number(data.quantiteRecue || data.Quantite_Recue || 0),
    Number(data.prixAchatUnitaire || data.Prix_Achat_Unitaire || 0),
    new Date()
  ];

  sheet.appendRow(row);

  // Incrémenter le stock dans la feuille « stock »
  mettreAJourStockApresReception(ss, data.nomProduit || data.Nom_Produit, Number(data.quantiteRecue || data.Quantite_Recue || 0));

  return { id: row[0], sheet: CONFIG.SHEET_FACTURES, duplicateAvoided: false };
}

/**
 * 5. Enregistrement d'un commerçant dans « liste_commercants »
 * Colonnes : N° | Nom et prénom du commerçant | Téléphone | Observation
 */
function enregistrerCommercant(ss, data) {
  var sheet = getOrCreateSheet(ss, CONFIG.SHEET_COMMERCANTS, [
    "N°", "Nom et prénom du commerçant", "Téléphone", "Observation"
  ]);

  var nomPrenom = String(data.nomPrenom || data.nom || "").trim();
  if (!nomPrenom) {
    throw new Error("Le nom et prénom du commerçant est obligatoire.");
  }

  var telephone = String(data.telephone || "").trim();
  var observation = String(data.observation || "").trim();

  // Contrôle anti-doublon (insensible à la casse)
  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    var existingValues = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    var lowerNew = nomPrenom.toLowerCase();
    for (var i = 0; i < existingValues.length; i++) {
      var currentName = String(existingValues[i][0]).trim().toLowerCase();
      if (currentName === lowerNew) {
        // Le commerçant existe déjà. On met à jour les coordonnées facultatives si fournies
        var rowTarget = i + 2;
        if (telephone) sheet.getRange(rowTarget, 3).setValue(telephone);
        if (observation) sheet.getRange(rowTarget, 4).setValue(observation);
        return {
          id: sheet.getRange(rowTarget, 1).getValue(),
          sheet: CONFIG.SHEET_COMMERCANTS,
          nom: nomPrenom,
          duplicateAvoided: true,
          message: "Commerçant « " + nomPrenom + " » déjà présent (informations actualisées)."
        };
      }
    }
  }

  var nextNumero = data.numero || (lastRow >= 1 ? lastRow : 1);
  var row = [
    nextNumero,
    nomPrenom,
    telephone,
    observation
  ];

  sheet.appendRow(row);
  return { id: nextNumero, sheet: CONFIG.SHEET_COMMERCANTS, nom: nomPrenom, duplicateAvoided: false };
}

/**
 * Recherche l'index de ligne par identifiant unique dans une colonne donnée
 */
function findRowIndexById(sheet, colIndex, idToFind) {
  if (!idToFind) return -1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  var rangeValues = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  var needle = String(idToFind).trim().toLowerCase();
  for (var i = 0; i < rangeValues.length; i++) {
    if (String(rangeValues[i][0]).trim().toLowerCase() === needle) {
      return i + 2;
    }
  }
  return -1;
}

/**
 * Récupère la liste actualisée des commerçants depuis « liste_commercants » ou « LISTE_COMMERCANTS »
 */
function getCommercantsList(ss) {
  // 1. Vérifier en priorité le nouvel onglet « liste_commercants »
  var sheet = ss.getSheetByName(CONFIG.SHEET_COMMERCANTS);
  if (sheet && sheet.getLastRow() >= 2) {
    var data = sheet.getDataRange().getValues();
    var list = [];
    for (var i = 1; i < data.length; i++) {
      var nom = String(data[i][1] || data[i][0]).trim();
      if (nom && nom !== "Nom et prénom du commerçant") {
        list.push({
          numero: data[i][0] || i,
          nom: nom,
          nomPrenom: nom,
          telephone: String(data[i][2] || "").trim(),
          observation: String(data[i][3] || "").trim()
        });
      }
    }
    if (list.length > 0) return list;
  }

  // 2. Fallback vers l'ancien onglet « LISTE_COMMERCANTS »
  var altSheet = ss.getSheetByName(CONFIG.SHEET_COMMERCANTS_ALT);
  if (altSheet && altSheet.getLastRow() >= 2) {
    var altValues = altSheet.getRange(2, 1, altSheet.getLastRow() - 1, altSheet.getLastColumn()).getValues();
    var altList = [];
    for (var j = 0; j < altValues.length; j++) {
      var val = String(altValues[j][0]).trim();
      if (val && val !== "Nom_Commercant") {
        altList.push({
          numero: j + 1,
          nom: val,
          nomPrenom: val,
          telephone: String(altValues[j][1] || "").trim(),
          observation: String(altValues[j][2] || "").trim()
        });
      }
    }
    return altList;
  }

  return [];
}

/**
 * Récupère les produits dont le STOCK RESTANT EST STRICTEMENT SUPÉRIEUR À ZÉRO (> 0)
 * 1. Lit directement l'onglet « stock » si présent.
 * 2. Si l'onglet « stock » n'existe pas, calcule dynamiquement :
 *    Stock = Total reçu dans « les factur » - Total vendu dans « les vents ».
 */
function getStockProduits(ss) {
  var stockSheet = ss.getSheetByName(CONFIG.SHEET_STOCK);
  var result = [];

  // Cas 1 : La feuille « stock » existe
  if (stockSheet && stockSheet.getLastRow() >= 2) {
    var data = stockSheet.getDataRange().getValues();
    var headers = data[0];
    
    var colNom = 0;
    var colStock = 1;
    var colPrixVente = -1;
    var colPrixAchat = -1;

    for (var h = 0; h < headers.length; h++) {
      var colHead = String(headers[h]).toLowerCase().trim();
      if (colHead.includes("produit") || colHead === "nom") colNom = h;
      if (colHead.includes("stock") || colHead.includes("restant") || colHead.includes("dispo") || colHead.includes("quantite")) colStock = h;
      if (colHead.includes("vente") || colHead.includes("pv")) colPrixVente = h;
      if (colHead.includes("achat") || colHead.includes("pa")) colPrixAchat = h;
    }

    for (var i = 1; i < data.length; i++) {
      var nom = String(data[i][colNom] || "").trim();
      var qty = Number(data[i][colStock] || 0);

      // EXCLUSION STRICTE : Ne jamais afficher les produits avec stock <= 0
      if (nom && !isNaN(qty) && qty > 0) {
        result.push({
          nom: nom,
          stockRestant: qty,
          prixVente: colPrixVente >= 0 ? Number(data[i][colPrixVente] || 0) : undefined,
          prixAchat: colPrixAchat >= 0 ? Number(data[i][colPrixAchat] || 0) : undefined
        });
      }
    }

    if (result.length > 0) return result;
  }

  // Cas 2 : Calcul dynamique depuis « les factur » et « les vents »
  var mapStock = {};

  // Ajouter les entrées depuis « les factur »
  var sheetFactures = ss.getSheetByName(CONFIG.SHEET_FACTURES);
  if (sheetFactures && sheetFactures.getLastRow() >= 2) {
    var factData = sheetFactures.getDataRange().getValues();
    for (var f = 1; f < factData.length; f++) {
      var pNom = String(factData[f][2] || "").trim();
      var qRecue = Number(factData[f][3] || 0);
      if (pNom && !isNaN(qRecue)) {
        mapStock[pNom] = (mapStock[pNom] || 0) + qRecue;
      }
    }
  }

  // Déduire les sorties depuis « les vents »
  var sheetVentes = ss.getSheetByName(CONFIG.SHEET_VENTES);
  if (sheetVentes && sheetVentes.getLastRow() >= 2) {
    var vteData = sheetVentes.getDataRange().getValues();
    for (var v = 1; v < vteData.length; v++) {
      var vNom = String(vteData[v][3] || "").trim();
      var qVendue = Number(vteData[v][4] || 0);
      if (vNom && !isNaN(qVendue)) {
        mapStock[vNom] = (mapStock[vNom] || 0) - qVendue;
      }
    }
  }

  for (var k in mapStock) {
    var finalQty = mapStock[k];
    if (finalQty > 0) {
      result.push({
        nom: k,
        stockRestant: finalQty
      });
    }
  }

  return result;
}

/**
 * Récupère tous les noms de produits enregistrés dans « les produit »
 */
function getAllProduitsNames(ss) {
  var sheet = ss.getSheetByName(CONFIG.SHEET_PRODUITS);
  if (!sheet || sheet.getLastRow() < 2) return [];

  var data = sheet.getDataRange().getValues();
  var set = {};
  var list = [];

  for (var i = 1; i < data.length; i++) {
    var nom = String(data[i][2] || "").trim();
    if (nom && !set[nom.toLowerCase()]) {
      set[nom.toLowerCase()] = true;
      list.push({
        nom: nom,
        prixAchat: Number(data[i][3] || 0),
        prixVente: Number(data[i][4] || 0)
      });
    }
  }

  return list;
}

/**
 * Décrémente le stock d'un produit dans la feuille « stock » après une vente
 */
function mettreAJourStockApresVente(ss, nomProduit, quantiteVendue) {
  if (!nomProduit || !quantiteVendue) return;
  var stockSheet = ss.getSheetByName(CONFIG.SHEET_STOCK);
  if (!stockSheet || stockSheet.getLastRow() < 2) return;

  var data = stockSheet.getDataRange().getValues();
  var lowerNom = String(nomProduit).toLowerCase().trim();

  for (var i = 1; i < data.length; i++) {
    var rowNom = String(data[i][0] || "").toLowerCase().trim();
    if (rowNom === lowerNom) {
      var currentStock = Number(data[i][1] || 0);
      var newStock = Math.max(0, currentStock - quantiteVendue);
      stockSheet.getRange(i + 1, 2).setValue(newStock);
      return;
    }
  }
}

/**
 * Incrémente le stock d'un produit dans la feuille « stock » après une réception/facture
 */
function mettreAJourStockApresReception(ss, nomProduit, quantiteRecue) {
  if (!nomProduit || !quantiteRecue) return;
  var stockSheet = ss.getSheetByName(CONFIG.SHEET_STOCK);
  if (!stockSheet) return;

  var lastRow = stockSheet.getLastRow();
  if (lastRow < 2) {
    stockSheet.appendRow([nomProduit, quantiteRecue]);
    return;
  }

  var data = stockSheet.getDataRange().getValues();
  var lowerNom = String(nomProduit).toLowerCase().trim();

  for (var i = 1; i < data.length; i++) {
    var rowNom = String(data[i][0] || "").toLowerCase().trim();
    if (rowNom === lowerNom) {
      var currentStock = Number(data[i][1] || 0);
      stockSheet.getRange(i + 1, 2).setValue(currentStock + quantiteRecue);
      return;
    }
  }

  stockSheet.appendRow([nomProduit, quantiteRecue]);
}

/**
 * Obtient ou crée une feuille avec ses en-têtes exacts
 */
function getOrCreateSheet(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      var range = sheet.getRange(1, 1, 1, headers.length);
      range.setFontWeight("bold");
      range.setBackground("#047857");
      range.setFontColor("#FFFFFF");
    }
  } else if (sheet.getLastRow() === 0 && headers && headers.length > 0) {
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#047857");
    headerRange.setFontColor("#FFFFFF");
  }
  return sheet;
}
`;
