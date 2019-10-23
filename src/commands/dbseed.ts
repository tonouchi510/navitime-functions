import commander from 'commander';
import admin from 'firebase-admin';
import csv2json from 'csvtojson';

import { collectionName } from './constants';
import serviceAccount from '../../google-services.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});
const db = admin.firestore();

const uploadSeed = async (collection: string) => {
  const ref = db.collection(collection);
  switch (collection) {
    case collectionName.users: {
      const docs = await csv2json()
        .fromFile('seeds/navitime_dev_users.csv')
        .then(jsonObj => {
          return jsonObj.map(record => ({
            ...record,
            emailVerified:
              record.emailVerified.toString().toLowerCase() === 'true',
            disabled: record.disabled.toString().toLowerCase() === 'true',
          }));
        });
      for await (const doc of docs) {
        admin.auth().createUser({
          uid: doc.uid,
          email: doc.email,
          emailVerified: doc.emailVerified,
          password: doc.password,
          displayName: doc.displayName,
          disabled: doc.disabled,
        });
        const ref2 = db.collection('users');
        const geop = new admin.firestore.GeoPoint(
          parseFloat(doc.geopoint.latitude),
          parseFloat(doc.geopoint.longitude),
        );
        const profile = {
          address: doc.address,
          geopoint: geop,
        };
        ref2.doc(doc.uid).set(profile);
      }

      return;
    }
    case collectionName.menus: {
      const docs = await csv2json()
        .fromFile('seeds/navitime_dev_menus.csv')
        .then(jsonObj => {
          return jsonObj.map(record => ({
            ...record,
          }));
        });
      for await (const doc of docs) {
        const { id } = doc;
        const docWithoutId = { ...doc };
        delete docWithoutId.id;
        if (id != null) {
          await ref.doc(id).set(docWithoutId);
        }
      }

      return;
    }
    case collectionName.shops: {
      const docs = await csv2json()
        .fromFile('seeds/navitime_dev_shops.csv')
        .then(jsonObj => {
          return jsonObj.map(record => ({
            ...record,
          }));
        });
      for await (const doc of docs) {
        doc.geopoint = new admin.firestore.GeoPoint(
          parseFloat(doc.geopoint.latitude),
          parseFloat(doc.geopoint.longitude),
        );

        const { id } = doc;
        const docWithoutId = { ...doc };
        delete docWithoutId.id;
        if (id != null) {
          await ref.doc(id).set(docWithoutId);
        }
      }

      return;
    }
    case collectionName.orders: {
      const docs = await csv2json()
        .fromFile('seeds/navitime_dev_orders.csv')
        .then(jsonObj => {
          return jsonObj.map(record => ({
            ...record,
          }));
        });
      for await (const doc of docs) {
        doc.shop.geopoint = new admin.firestore.GeoPoint(
          parseFloat(doc.shop.geopoint.latitude),
          parseFloat(doc.shop.geopoint.longitude),
        );
        doc.user_info.geopoint = new admin.firestore.GeoPoint(
          parseFloat(doc.user_info.geopoint.latitude),
          parseFloat(doc.user_info.geopoint.longitude),
        );
        // TODO: created_atの修正も必要

        const { id } = doc;
        const docWithoutId = { ...doc };
        delete docWithoutId.id;
        if (id != null) {
          await ref.doc(id).set(docWithoutId);
        }
      }

      return;
    }
    default: {
      throw new Error('specify target collection');
    }
  }
};
commander
  .version('0.1.0', '-v, --version')
  .arguments('<collection>')
  .action(uploadSeed);
commander.parse(process.argv);
