import { auth, db } from '../firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  TwitterAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ethers } from 'ethers';

const googleProvider = new GoogleAuthProvider();
const twitterProvider = new TwitterAuthProvider();

export const authService = {
  // Google Sign In
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await this.createUserProfile(result.user);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  },

  // Twitter Sign In
  async signInWithTwitter() {
    try {
      const result = await signInWithPopup(auth, twitterProvider);
      await this.createUserProfile(result.user);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Twitter:', error);
      throw error;
    }
  },

  // Email/Password Sign Up
  async signUpWithEmail(email, password) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await this.createUserProfile(result.user);
      return result.user;
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  },

  // Email/Password Sign In
  async signInWithEmail(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  },

  // Metamask Sign In
  async signInWithMetamask() {
    try {
      if (!window.ethereum) {
        throw new Error('Metamask not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      // Sign a message to verify ownership
      const message = `Sign this message to authenticate with Don't Die Agent: ${Date.now()}`;
      const signature = await signer.signMessage(message);
      
      // Here you would typically verify the signature on your backend
      // For now, we'll just create/update the user profile
      const userProfile = {
        uid: address,
        displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
        photoURL: null,
        bio: '',
        connectedWallet: address,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', address), userProfile, { merge: true });
      return userProfile;
    } catch (error) {
      console.error('Error signing in with Metamask:', error);
      throw error;
    }
  },

  // Sign Out
  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Create User Profile
  async createUserProfile(user) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          email: user.email || null,
          bio: '',
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }
}; 