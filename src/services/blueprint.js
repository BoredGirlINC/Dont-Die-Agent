import { db } from '../firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

export const blueprintService = {
  // Save a new blueprint
  async saveBlueprint(userId, content, tag = '') {
    try {
      const blueprintData = {
        userId,
        content,
        tag,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'blueprints'), blueprintData);
      return docRef.id;
    } catch (error) {
      console.error('Error saving blueprint:', error);
      throw error;
    }
  },

  // Update blueprint tag
  async updateBlueprintTag(blueprintId, newTag) {
    try {
      const blueprintRef = doc(db, 'blueprints', blueprintId);
      await updateDoc(blueprintRef, { tag: newTag });
    } catch (error) {
      console.error('Error updating blueprint tag:', error);
      throw error;
    }
  },

  // Get user's blueprints
  async getUserBlueprints(userId) {
    try {
      const blueprintsQuery = query(
        collection(db, 'blueprints'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(blueprintsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user blueprints:', error);
      throw error;
    }
  },

  // Get a single blueprint
  async getBlueprint(blueprintId) {
    try {
      const blueprintRef = doc(db, 'blueprints', blueprintId);
      const blueprintSnap = await getDoc(blueprintRef);
      
      if (blueprintSnap.exists()) {
        return {
          id: blueprintSnap.id,
          ...blueprintSnap.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting blueprint:', error);
      throw error;
    }
  }
}; 