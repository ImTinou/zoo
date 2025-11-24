// Firebase Configuration and Services
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBKeQ-SY4gXEuGMPZhYx6MKBXX2djQJ4b8",
    authDomain: "zoo1-d3a2c.firebaseapp.com",
    projectId: "zoo1-d3a2c",
    storageBucket: "zoo1-d3a2c.firebasestorage.app",
    messagingSenderId: "515698748498",
    appId: "1:515698748498:web:143cd469ae6637f6de438b",
    measurementId: "G-J1YK1E1BHL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Firebase Service Class
class FirebaseService {
    constructor() {
        this.currentUser = null;
        this.onAuthStateChangedCallbacks = [];

        // Listen to auth state changes
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.onAuthStateChangedCallbacks.forEach(callback => callback(user));
        });
    }

    // Auth Methods
    async register(email, password, displayName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update display name
            if (displayName) {
                await updateProfile(user, { displayName });
            }

            // Create user profile in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: displayName || email.split('@')[0],
                createdAt: new Date().toISOString(),
                friends: [],
                publicZoos: []
            });

            return { success: true, user };
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: error.message };
        }
    }

    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    onAuthStateChange(callback) {
        this.onAuthStateChangedCallbacks.push(callback);
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Zoo Save Methods
    async saveZoo(zooData, isPublic = false) {
        if (!this.currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const zooDoc = {
                ...zooData,
                userId: this.currentUser.uid,
                userName: this.currentUser.displayName || this.currentUser.email,
                isPublic: isPublic,
                lastUpdated: new Date().toISOString()
            };

            await setDoc(doc(db, 'zoos', this.currentUser.uid), zooDoc);

            // Update user's public zoos list if public
            if (isPublic) {
                const userRef = doc(db, 'users', this.currentUser.uid);
                await updateDoc(userRef, {
                    publicZoos: [this.currentUser.uid]
                });
            }

            return { success: true };
        } catch (error) {
            console.error('Save zoo error:', error);
            return { success: false, error: error.message };
        }
    }

    async loadZoo(userId = null) {
        const targetUserId = userId || this.currentUser?.uid;

        if (!targetUserId) {
            return { success: false, error: 'No user specified' };
        }

        try {
            const zooDoc = await getDoc(doc(db, 'zoos', targetUserId));

            if (zooDoc.exists()) {
                return { success: true, data: zooDoc.data() };
            } else {
                return { success: false, error: 'Zoo not found' };
            }
        } catch (error) {
            console.error('Load zoo error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteZoo() {
        if (!this.currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            await deleteDoc(doc(db, 'zoos', this.currentUser.uid));
            return { success: true };
        } catch (error) {
            console.error('Delete zoo error:', error);
            return { success: false, error: error.message };
        }
    }

    // Public Zoos Methods
    async getPublicZoos(limitCount = 20) {
        try {
            const q = query(
                collection(db, 'zoos'),
                where('isPublic', '==', true),
                orderBy('lastUpdated', 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            const zoos = [];

            querySnapshot.forEach((doc) => {
                zoos.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return { success: true, zoos };
        } catch (error) {
            console.error('Get public zoos error:', error);
            return { success: false, error: error.message };
        }
    }

    // Friends Methods
    async addFriend(friendId) {
        if (!this.currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const userRef = doc(db, 'users', this.currentUser.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const friends = userData.friends || [];

                if (!friends.includes(friendId)) {
                    friends.push(friendId);
                    await updateDoc(userRef, { friends });
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Add friend error:', error);
            return { success: false, error: error.message };
        }
    }

    async removeFriend(friendId) {
        if (!this.currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const userRef = doc(db, 'users', this.currentUser.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const friends = (userData.friends || []).filter(id => id !== friendId);
                await updateDoc(userRef, { friends });
            }

            return { success: true };
        } catch (error) {
            console.error('Remove friend error:', error);
            return { success: false, error: error.message };
        }
    }

    async getFriends() {
        if (!this.currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));

            if (userDoc.exists()) {
                const friendIds = userDoc.data().friends || [];
                const friends = [];

                // Get friend details
                for (const friendId of friendIds) {
                    const friendDoc = await getDoc(doc(db, 'users', friendId));
                    if (friendDoc.exists()) {
                        friends.push({
                            id: friendId,
                            ...friendDoc.data()
                        });
                    }
                }

                return { success: true, friends };
            }

            return { success: true, friends: [] };
        } catch (error) {
            console.error('Get friends error:', error);
            return { success: false, error: error.message };
        }
    }

    async searchUsers(searchTerm) {
        try {
            const usersRef = collection(db, 'users');
            const querySnapshot = await getDocs(usersRef);
            const users = [];

            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                if (
                    userData.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    userData.email?.toLowerCase().includes(searchTerm.toLowerCase())
                ) {
                    users.push({
                        id: doc.id,
                        ...userData
                    });
                }
            });

            return { success: true, users };
        } catch (error) {
            console.error('Search users error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserProfile(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));

            if (userDoc.exists()) {
                return { success: true, user: userDoc.data() };
            }

            return { success: false, error: 'User not found' };
        } catch (error) {
            console.error('Get user profile error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export singleton instance
const firebaseService = new FirebaseService();
export default firebaseService;
