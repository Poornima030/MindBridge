import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { auth } from './config.ts';
import { createUserProfile, getUserProfile } from './firestoreService.ts';
import { UserProfile } from '../types.ts';

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update display name in Firebase Auth
  await updateProfile(user, { displayName: name });

  // Create document in Firestore 'users' collection
  const profile = await createUserProfile(user.uid, name, email);

  return { user, profile };
}

export async function loginUser(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export { getUserProfile };
