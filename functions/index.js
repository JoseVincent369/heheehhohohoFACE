const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.deleteUser = functions.https.onCall(async (data, context) => {
    // Ensure that the request is from an authenticated admin
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Must be an admin to delete users');
    }

    const uid = data.uid;

    try {
        // Delete the user from Firebase Auth
        await admin.auth().deleteUser(uid);
        // Additionally, delete user data from Firestore or Realtime Database if needed
        // await admin.firestore().collection('users').doc(uid).delete();
        return { success: true };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
