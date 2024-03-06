// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: 'AIzaSyCgjsLL1l7o9oKpELGcWn17zLD86WSiMc0',
	authDomain: 'caption-creators.firebaseapp.com',
	projectId: 'caption-creators',
	storageBucket: 'caption-creators.appspot.com',
	messagingSenderId: '506896881130',
	appId: '1:506896881130:web:b00076070925a5028ece93',
	measurementId: 'G-2HM29KRGMH',
};

// Check that `window` is in scope for the analytics module!
const app = initializeApp(firebaseConfig);

export default app;
