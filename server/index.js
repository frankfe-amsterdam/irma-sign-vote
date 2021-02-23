const express = require('express');
const IrmaBackend = require('@privacybydesign/irma-backend');
const IrmaJwt = require('@privacybydesign/irma-jwt');
const app = express();
const cors = require('cors');
const util = require('util');
const fs = require('fs');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

let config;
let irmaBackend;
let irmaPrivateKey;

const setConfig = async () => {
    let configFile = 'config.json';
    if (process.env.NODE_ENV === 'production') {
        configFile = 'config.prod.json';
    }
    const json = await util.promisify(fs.readFile)(configFile, 'utf-8');
    console.log('Using config', json);
    config = JSON.parse(json);
    initializeIrmaBackend(config.irma);
};

initializeIrmaBackend = irmaServerUrl => {
    irmaBackend = new IrmaBackend(irmaServerUrl, {
        debugging: true
    });
};

const init = async () => {
    if (!process.env.IRMA_PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY is not set');
    } else {
        irmaPrivateKey = process.env.IRMA_PRIVATE_KEY.replace(/\\n/g, '\n');
    }

    try {
        // read the config file only once each session
        if (config === undefined) {
            await setConfig();
        }

        app.use(express.json());

        app.get('/start', cors(), irmaSignRequest);
        app.get('/result', cors(), getIrmaSessionResult);
        app.get('/config', cors(), getConfig);
        app.get('/health', cors(), health);

        if (process.env.NODE_ENV === 'acceptance' || process.env.NODE_ENV === 'production') {
            app.use(express.static(config.docroot, { index: false }));
            app.get('*', secured, function (req, res) {
                res.sendFile(path.join(__dirname, config.docroot, 'index.html'));
            });
        } else {
            console.log('Using proxy to the client for development');
            app.use(
                '/',
                createProxyMiddleware({
                    target: 'http://localhost:8080',
                    changeOrigin: true
                })
            );
        }

        app.listen(config.port, () =>
            console.log(`Di-demo backend running in ${process.env.NODE_ENV || 'development'} mode.`)
        );
    } catch (e) {
        console.log(e);
        error(e);
    }
};

const createJWT = (authmethod, key, iss, irmaRequest) => {
    const irmaJwt = new IrmaJwt(authmethod, { secretKey: key, iss });
    const jwt = irmaJwt.signSessionRequest(irmaRequest);
    return jwt;
};

const createIrmaRequest = () => {
    return {
        '@context': 'https://irma.app/ld/request/signature/v2',
        message: 'Message to be signed',
        disclose: [[['irma-demo.stemmen.stempas.votingnumber']]]
    };
};

const irmaSignRequest = async (req, res) => {
    const authmethod = 'publickey';
    const request = createIrmaRequest();
    const jwt = createJWT(authmethod, irmaPrivateKey, config.requestorname, request);

    try {
        const session = await irmaBackend.startSession(jwt);

        res.status(200).json(session);
    } catch (err) {
        return res.status(405).json({ err: err.message });
    }
};

const getIrmaSessionResult = async (req, res) => {
    try {
        const result = await irmaBackend.getSessionResult(req.query.token);
        res.json(result);
    } catch (e) {
        console.log('irma.getSessionResuilt error:', JSON.stringify(e));
        error(e, res);
    }
};

const health = async (req, res) => {
    return res.status(200).send('Healthy!');
};

const getConfig = async (req, res) => {
    config.environment = process.env.NODE_ENV;
    console.log('get config', JSON.stringify(config));
    res.json(config);
};

const error = (e, res) => {
    const jsonError = JSON.stringify(e);
    console.error('Node error', jsonError);
    if (res) {
        res.json({ error: jsonError });
    }
};

init();
// app.use('/', createProxyMiddleware({ target: 'http://www.example.org', changeOrigin: true }));

// app.listen(3000);
