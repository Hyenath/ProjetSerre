const express = require('express');
const nodemailer = require('nodemailer');

const RegulationManager = require('./RegulationManager').default;

const config = require('../config.json');

const app = express();

class MainManager {
    constructor() {
        this.database = 'mysql';
        this.waterManager = null; // Instance de WaterManager
        this.regulationManager = new RegulationManager('192.168.65.252', 80); // Instance de RegulationManager
        this.wss = null; // Instance de WebSocketServer
        this.regulationParameters = null; // Instance de RegulationParameters
        this.rfidReader = null; // Instance de RFIDReader
        this.eth002b = null; // Instance de ETH002B
    }
    
    updateSystem() {}
    
    insertRegulationEvent() {}
    
    setupAPIEndpoints() {
        app.post('/vasistas', async (req, res) => {
            
        })
    }
    
    sendMailAlert(message) {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: config.mail.sender,
                pass: config.mail.password
            }
        });
        
        const mailOptions = {
            from: config.mail.sender,
            to: config.mail.receiver,
            subject: config.mail.subject,
            text: message
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("Erreur:", error);
            } else {
                console.log("Email envoyé:", info.response);
            }
        });
    }    
    
    sendSystemStateToWSClients() {}
    
    loadRegulationParameters() {}
    
    saveRegulationParameters() {}
    
    RFIDReadEventHandler(rfid) {}
}

module.exports=MainManager;