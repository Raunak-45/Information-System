// Firestore reference assumed to be set as `db` in index.html
const cardsCollection = firebase.firestore().collection('cards');

// Save a card to Firestore
function saveCard(card) {
    return cardsCollection.add(card);
}

// Get all cards from Firestore
async function getCards() {
    const snapshot = await cardsCollection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Update card
function updateCard(id, updatedData) {
    return cardsCollection.doc(id).update(updatedData);
}

// Delete card
function deleteCard(id) {
    return cardsCollection.doc(id).delete();
}
