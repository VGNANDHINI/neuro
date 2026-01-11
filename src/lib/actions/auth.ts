'use server';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  age: z.coerce.number().optional(),
  gender: z.string().optional(),
});

export async function registerUser(values: z.infer<typeof registerSchema>) {
  try {
    const validatedFields = registerSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: 'Invalid fields.' };
    }

    const { name, email, password, age, gender } = validatedFields.data;

    // This is happening on the server, but using client SDK. A real app should use Admin SDK.
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: name });

    await setDoc(doc(db, 'users', user.uid), {
      name,
      email,
      age: age || null,
      gender: gender || null,
      createdAt: serverTimestamp(),
    });

    return { success: 'Registration successful!' };
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      return { error: 'Email already registered.' };
    }
    return { error: 'An unexpected error occurred.' };
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export async function loginUser(values: z.infer<typeof loginSchema>) {
  try {
    const validatedFields = loginSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: 'Invalid fields.' };
    }
    const { email, password } = validatedFields.data;

    await signInWithEmailAndPassword(auth, email, password);
    return { success: 'Login successful!' };
  } catch (error: any) {
    if (error.code === 'auth/invalid-credential') {
      return { error: 'Invalid email or password.' };
    }
    return { error: 'An unexpected error occurred.' };
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: 'Logged out successfully.' };
  } catch (error) {
    return { error: 'Failed to log out.' };
  }
}
