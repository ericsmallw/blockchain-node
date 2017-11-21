module.exports = {
    "extends": "eslint:recommended",
    "parser": "babel-eslint",
    "parserOptions": {
        "sourceType": "module",
        "allowImportExportEverywhere": true,
        "codeFrame": false
    },
    "env": {
        "browser": true,
        "node": true,
        "es6": true
    },
    "rules": {
        "no-var" : 2
    }
};