import React from 'react';
import firebase from 'firebase';
import {FirebaseClientService} from '@canner/image-service-config';
import * as GraphQLinterface from 'canner-graphql-interface';

const firebaseConfig = {
  apiKey: "AIzaSyB_1bAQF1OyBl4Vl8PhOli20OgWaV4KVrQ",
  authDomain: "dddd-12a2c.firebaseapp.com",
  databaseURL: "https://dddd-12a2c.firebaseio.com",
  projectId: "dddd-12a2c",
  storageBucket: "dddd-12a2c.appspot.com",
  messagingSenderId: "578160195308"
};

if (!firebase.apps.length) {
  // Setup connector to connect your services
  firebase.initializeApp(firebaseConfig);
}
const defaultApp = firebase.app();
const connector = new GraphQLinterface.FirebaseRtdbClientConnector({
  database: defaultApp.database()
});

const storage = new FirebaseClientService({
  firebase,
  dir: 'CANNER_CMS',
  filename: '',
  hash: true
}).getServiceConfig();

exports.firebaseConfig = firebaseConfig;
exports.connector = connector;
exports.storage = {};
exports.renderRelationField = function(text, record) {
  return <span>
    {text.length}
  </span>
}