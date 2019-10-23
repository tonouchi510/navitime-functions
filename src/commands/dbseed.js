import commander from 'commander'
import admin from 'firebase-admin'
import csv2json from 'csvtojson'

import { collectionName } from './constants'
import serviceAccount from '../../google-services.json'

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})
const db = admin.firestore()

const uploadSeed = async (collection) => {
    const ref = db.collection(collection)
    switch (collection) {
        case collectionName.users: {
            const docs = await csv2json()
                .fromFile('seeds/navitime_dev_users.csv')
                .then(jsonObj => {
                    return jsonObj.map((record) => ({
                        ...record,
                        emailVerified: record.emailVerified.toString().toLowerCase() === 'true',
                        disabled: record.disabled.toString().toLowerCase() === 'true',
                    }))
                })
            for await (const doc of docs) {
                admin.auth().createUser({
                    uid: doc.uid,
                    email: doc.email,
                    emailVerified: doc.emailVerified,
                    password: doc.password,
                    displayName: doc.displayName,
                    disabled: doc.disabled,
                })
                const ref2 = db.collection('users')
                const geop = admin.firestore.GeoPoint(doc.geopoint.latitude, doc.geopoint.longitude)
                const profile = {
                    address: doc.address,
                    geopoint: geop,
                }
                ref2.doc(doc.uid).set(profile)
            }

            return
        }
        case collectionName.menus: {
            const docs = await csv2json({ nullObject: false })
                .fromFile('seeds/navitime_dev_menus.csv')
                .then(jsonObj => {
                    return jsonObj.map((record) => ({
                        ...record,
                    }))
                })
            for await (const doc of docs) {
                const { uid } = doc
                const docWithoutId = { ...doc }
                delete docWithoutId.uid
                if (uid != null) {
                    await ref.doc(uid).set(docWithoutId)
                }
            }

            return
        }
        case collectionName.shops: {
            const docs = await csv2json()
                .fromFile('seeds/navitime_dev_shops.csv')
                .then(jsonObj => {
                    return jsonObj.map((record) => ({
                        ...record,
                    }))
                })
            for await (const doc of docs) {
                doc.geopoint = admin.firestore.GeoPoint(doc.geopoint.latitude, doc.geopoint.longitude)

                const { id } = doc
                const docWithoutId = { ...doc }
                delete docWithoutId.id
                if (id != null) {
                    await ref.doc(id).set(docWithoutId)
                }
            }
            return
        }
        case collectionName.orders: {
            const docs = await csv2json()
                .fromFile('seeds/navitime_dev_orders.csv')
                .then(jsonObj => {
                    return jsonObj.map((record) => ({
                        ...record,
                    }))
                })
            for await (const doc of docs) {
                doc.shop.geopoint = admin.firestore.GeoPoint(doc.shop.geopoint.latitude, doc.user_info.geopoint.longitude)
                doc.user_info.geopoint = admin.firestore.GeoPoint(doc.shop.geopoint.latitude, doc.user_info.geopoint.longitude)
                // TODO: created_atの修正も必要

                const { id } = doc
                const docWithoutId = { ...doc }
                delete docWithoutId.id
                if (id != null) {
                    await ref.doc(id).set(docWithoutId)
                }
            }
            return
        }
        default: {
            throw new Error('specify target collection')
        }
    }
}
commander
    .version('0.1.0', '-v, --version')
    .arguments('<collection>')
    .action(uploadSeed)
commander.parse(process.argv)