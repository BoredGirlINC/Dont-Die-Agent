import { auth, db } from '../firebase';
import {
  signInWithPopup,
  TwitterAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  fetchSignInMethodsForEmail,
  signInWithCredential,
  linkWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const twitterProvider = new TwitterAuthProvider();
const googleProvider = new GoogleAuthProvider();

export const authService = {
  // Google Sign In
  async signInWithGoogle() {
    try {
      // Configure Google Auth Provider to allow account linking
      googleProvider.setCustomParameters({
        // This allows a user to sign in with a different account each time
        prompt: 'select_account'
      });
      
      try {
        // First, try direct sign-in
        const result = await signInWithPopup(auth, googleProvider);
        await this.createUserProfile(result.user);
        return result.user;
      } catch (error) {
        // Handle account exists with different credential error
        if (error.code === 'auth/account-exists-with-different-credential') {
          // Get the existing email
          const email = error.customData.email;
          
          // Fetch sign-in methods for this email
          const methods = await fetchSignInMethodsForEmail(auth, email);
          
          if (methods.includes('password')) {
            // Show a message to the user explaining the situation
            const message = `An account already exists with the email ${email}. Would you like to sign in with your password?`;
            if (window.confirm(message)) {
              const password = window.prompt('Please enter your password to link accounts:');
              if (password) {
                // Sign in with email/password
                const emailCredential = EmailAuthProvider.credential(email, password);
                const result = await signInWithCredential(auth, emailCredential);
                
                // Link the Google credential to this account
                await linkWithCredential(result.user, error.credential);
                return result.user;
              }
            }
          }
          
          // If we get here, either the user cancelled or linking failed
          throw error;
        } else {
          // For other errors, just rethrow
          throw error;
        }
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  },
  
  // Twitter Sign In
  async signInWithTwitter() {
    try {
      console.log('Starting Twitter sign in process...');
      
      // Set Twitter Auth Provider parameters to get additional user info
      twitterProvider.setCustomParameters({
        lang: 'en'
      });
      
      console.log('Twitter provider configured, opening popup...');
      const result = await signInWithPopup(auth, twitterProvider);
      
      console.log('Twitter sign in successful:', result.user.uid);
      
      // Try to extract Twitter bio if available
      const twitterBio = result.user.reloadUserInfo.providerUserInfo
        .find(p => p.providerId === 'twitter.com')?.bio || '';
      
      // Get Twitter profile data
      const credential = TwitterAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const secret = credential.secret;
      
      // Include bio in user profile if available
      await this.createUserProfile(result.user, { bio: twitterBio });
      
      return result.user;
    } catch (error) {
      console.error('Twitter sign in error details:', {
        code: error.code,
        message: error.message,
        email: error.customData?.email,
        credential: error.credential ? 'Present' : 'Missing',
        customData: error.customData
      });
      
      if (error.code === 'auth/invalid-credential') {
        console.log('Invalid credential error. This usually means:');
        console.log('1. Twitter API keys are incorrect in Firebase');
        console.log('2. Twitter callback URL is not configured correctly');
        console.log('3. Twitter app permissions are not set correctly');
      }
      
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

  // Update User Profile
  async updateUserProfile(user, profileData) {
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: profileData.displayName || user.displayName,
        photoURL: profileData.photoURL || user.photoURL
      });
      
      // Update Firestore user document
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName: profileData.displayName || user.displayName,
        photoURL: profileData.photoURL || user.photoURL,
        bio: profileData.bio || '',
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      return user;
    } catch (error) {
      console.error('Error updating user profile:', error);
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
  async createUserProfile(user, additionalData = {}) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          email: user.email || null,
          bio: additionalData.bio || '',
          emojis: additionalData.emojis || ['😊', '👍', '��'], // Default emojis
          createdAt: serverTimestamp()
        });
      } else {
        // Update existing user with new data if provided
        if (Object.keys(additionalData).length > 0) {
          await setDoc(userRef, {
            ...additionalData,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },
  
  // Get User Profile
  async getUserProfile(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }
}; 