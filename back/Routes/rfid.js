const express = require('express');
const config = require('../config.json');
const db = require('../DataBase/db');
const ModbusRTU = require('modbus-serial');
const EventEmitter = require('events');

const app = express();
app.use(express.json()); // Pour parser JSON dans req.body

//-----------------------------------------Fonction pour lire le RFID via Modbus-------------------------------------//
async function lireRFIDviaModbus(ip, port = 502, registre = 1000, nbRegistres = 15) {
  const client = new ModbusRTU();

  function modbusDataToAscii(data) {
    const bytes = [];
    data.forEach(code => {
      bytes.push((code >> 8) & 0xFF);
      bytes.push(code & 0xFF);
    });
    let result = '';
    for (const b of bytes) {
      if (b === 0) break; // arrêt à premier 0 (fin chaîne)
      if (b >= 32 && b <= 126) { // caractères imprimables ASCII
        result += String.fromCharCode(b);
      }
    }
    return result.trim();
  }

  try {
    await Promise.race([
      client.connectTCP(ip, { port }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout connexion Modbus')), 5000))
    ]);

    client.setID(1);

    const data = await client.readHoldingRegisters(registre, nbRegistres);

    if (!data || !data.data || data.data.length === 0) {
      throw new Error("Aucune donnée lue depuis les registres");
    }

    // Ne rien retourner si données toutes nulles
    if (data.data.every(code => code === 0)) {
      return null;
    }

    console.log(`Données brutes lues depuis Modbus:`, data.data);

    let rfid_ascii = modbusDataToAscii(data.data);

    let rfid_hex = data.data.map(code =>
      ((code >> 8).toString(16).padStart(2, '0') + (code & 0xFF).toString(16).padStart(2, '0'))
    ).join("").toUpperCase();

    const rfid_id = rfid_ascii.length > 0 ? rfid_ascii : rfid_hex;

    console.log(`UID lu via Modbus : ASCII="${rfid_ascii}" | HEX="${rfid_hex}"`);

    return rfid_id;
  } catch (err) {
    console.error("Erreur lecture Modbus RFID :", err);
    throw err;
  } finally {
    try {
      await client.close();
      console.log("Connexion Modbus fermée");
    } catch (e) {
      console.warn("Erreur lors de la fermeture de la connexion Modbus :", e.message);
    }
  }
}

//-----------------------------------------Lecteur RFID en écoute continue-------------------------------------//
class RFIDReader extends EventEmitter {
  constructor(ip, port = 502) {
    super();
    this.ip = ip;
    this.port = port;
    this.lastId = null;
    this.client = new ModbusRTU();
    this.isConnected = false;
  }

  async connect() {
    await this.client.connectTCP(this.ip, { port: this.port });
    this.client.setID(1);
    this.isConnected = true;
    console.log("Connecté au lecteur Modbus");
  }

  poll(intervalMs = 2000) {
    if (!this.isConnected) {
      throw new Error("Lecteur Modbus non connecté");
    }

    const uidVide = "000000000000000054000078020000000000000000000000000000000000";

    const isEmptyOrInvalid = (str) => {
      if (!str) return true;
      const onlyZerosOrNonPrintable = [...str].every(c => c === '0' || c.charCodeAt(0) < 32);
      return onlyZerosOrNonPrintable;
    };

    setInterval(async () => {
      try {
        const data = await this.client.readHoldingRegisters(1000, 15);

        if (data.data.every(code => code === 0)) {
          if (this.lastId !== null) {
            this.lastId = null;
            console.log("Carte retirée (données vides)");
          }
          return;
        }

        let rfid_ascii = '';
        for (const code of data.data) {
          const highByte = (code >> 8) & 0xFF;
          if (highByte === 0) break;
          if (highByte >= 32 && highByte <= 126) rfid_ascii += String.fromCharCode(highByte);

          const lowByte = code & 0xFF;
          if (lowByte === 0) break;
          if (lowByte >= 32 && lowByte <= 126) rfid_ascii += String.fromCharCode(lowByte);
        }
        rfid_ascii = rfid_ascii.trim();

        let rfid_hex = data.data.map(code =>
          ((code >> 8).toString(16).padStart(2, '0') + (code & 0xFF).toString(16).padStart(2, '0'))
        ).join("").toUpperCase();

        const rfid_id = rfid_ascii.length > 0 ? rfid_ascii : rfid_hex;

        if (isEmptyOrInvalid(rfid_id)) {
          if (this.lastId !== null) {
            this.lastId = null;
            console.log("Carte retirée (ID invalide ou vide)");
          }
          return;
        }

        if (rfid_id === uidVide) {
          if (this.lastId !== uidVide) {
            this.lastId = uidVide;
          }
          return;
        }

        if (rfid_id !== this.lastId) {
          this.lastId = rfid_id;
          this.emit('newCard', rfid_id);
          console.log("Nouvelle carte détectée:", rfid_id);

          ////////////////////////////////////// posrRFIDLog Automatique /////////////////////////////////////
          db.query('SELECT * FROM AuthorizedAccess WHERE rfid_id = ?', [rfid_id], (err, results) => {
            if (err) {
              console.error("Erreur DB (vérification autorisation):", err);
              return;
            }

            if (results.length === 0) {
              console.log(`UID ${rfid_id} non autorisé`);
              return;
            }

            db.query('INSERT INTO TimestampedAccess (rfid_id, date) VALUES (?, NOW())', [rfid_id], (err, result) => {
              if (err) {
                console.error("Erreur insertion log d'accès:", err);
              } else {
                console.log(`Accès autorisé pour UID ${rfid_id}, log inséré avec ID ${result.insertId}`);
              }
            });
          });
        }

      } catch (err) {
        console.error("Erreur lecture Modbus dans poll:", err.message);
      }
    }, intervalMs);
  }
}

const ipLecteurDefaut = "192.168.65.240";
const rfidReader = new RFIDReader(ipLecteurDefaut);

rfidReader.connect()
  .then(() => rfidReader.poll(3000))
  .catch(err => console.error("Erreur connexion Modbus au démarrage:", err.message));

// 👇 L'event est toujours là mais n'est plus nécessaire si le log est automatique
rfidReader.on('newCard', (rfid_id) => {
  // facultatif
});

//------------------------------------------AJOUT DES LOGS-------------------------------------//
app.post(config.postRFIDLog, async (req, res) => {
  const ipLecteur = req.body?.ip || "192.168.65.240";

  try {
    const rfid_id = await lireRFIDviaModbus(ipLecteur);

    if (!rfid_id || rfid_id.length === 0) {
      return res.status(400).json({ success: false, message: "UID introuvable via Modbus !" });
    }

    const authorizedUser = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM AuthorizedAccess WHERE rfid_id = ?', [rfid_id], (err, results) => {
        if (err) return reject(err);
        resolve(results.length > 0 ? results[0] : null);
      });
    });

    if (!authorizedUser) {
      return res.status(403).json({ success: false, message: `UID ${rfid_id} non autorisé !` });
    }

    const timestampResult = await new Promise((resolve, reject) => {
      db.query('INSERT INTO TimestampedAccess (rfid_id, date) VALUES (?, NOW())', [rfid_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    res.json({
      success: true,
      accessGranted: true,
      message: `Accès autorisé pour UID ${rfid_id}, ID log : ${timestampResult.insertId}`
    });

  } catch (err) {
    console.error("Erreur dans le traitement RFID via Modbus :", err);
    res.status(500).json({ success: false, error: "Erreur serveur Modbus ou base de données" });
  }
});

module.exports = app;
