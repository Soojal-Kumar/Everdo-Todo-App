import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from './firebase'; // Adjust path if needed
import { Feather } from '@expo/vector-icons';

// Color Palette
const richBlack = '#001524';
const caribbeanCurrent = '#15616D';
const papayaWhip = '#FFECD1';
const orangeWheel = '#FF7D00';
const sienna = '#78290F';
const lightGray = '#eee';
const darkGray = '#333';

export default function SignUpScreen({ navigation }) {
     const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');


    const validateEmail = (email) => {
      if(!email){
            return "Email cannot be empty."
        }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email) ? '' : 'Invalid email format';
    };

    const validatePassword = (password) => {
      if (!password) {
            return "Password cannot be empty."
        } else if (password.length < 6) {
          return "Password must be at least 6 characters long";
        }
       return "";
    };
 const handleSignUp = async () => {
        const emailErr = validateEmail(email);
        const passwordErr = validatePassword(password);

        setEmailError(emailErr);
        setPasswordError(passwordErr);
        if (emailErr || passwordErr) {
            return;
        }
        try {
             await createUserWithEmailAndPassword(auth, email, password);
            Alert.alert("Success", "Account created successfully. Please log in.");
            navigation.navigate("SignIn");
        } catch (error) {
            console.error("Error during sign-up:", error);
             switch (error.code) {
                case 'auth/email-already-in-use':
                    Alert.alert("Error", "This email is already in use.");
                    break;
                case 'auth/invalid-email':
                    Alert.alert("Error", "Invalid email format.");
                    break;
                case 'auth/weak-password':
                    Alert.alert("Error", "Password should be at least 6 characters.");
                    break;
                default:
                    Alert.alert("Error", error.message);
            }
        }
    };

    return (
         <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Feather name="leaf" size={60} color={caribbeanCurrent} />
                <Text style={styles.title}>EverDo</Text>
            </View>

            <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                 placeholder="Email Address"
                 value={email}
                 onChangeText={setEmail}
                 keyboardType="email-address"
                 autoCapitalize="none"
                 placeholderTextColor={darkGray}
                onBlur = {() => setEmailError(validateEmail(email))}

            />
             {emailError && <Text style={styles.errorText}>{emailError}</Text>}
            <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                 autoCapitalize="none"
                placeholderTextColor={darkGray}
                 onBlur = {() => setPasswordError(validatePassword(password))}
            />
             {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
            <TouchableOpacity
                style={styles.signUpButton}
                onPress={handleSignUp}
            >
                <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
             <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                  <Text style={styles.signInLinkText}>Sign In</Text>
                </TouchableOpacity>
            </View>

         </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        backgroundColor: papayaWhip,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: richBlack,
        marginTop: 10
    },
    input: {
       borderWidth: 1,
        borderColor: lightGray,
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        fontSize: 16,
        backgroundColor: 'white',
        color: darkGray,
    },
    inputError: {
        borderColor: 'red',
    },
    errorText: {
      color: 'red',
      fontSize: 12,
      marginBottom: 5
  },
    signUpButton: {
        backgroundColor: caribbeanCurrent,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
         marginTop: 20,
    },
     buttonText: {
        fontSize: 18,
        color: papayaWhip,
         fontWeight: 'bold',
    },
     footer: {
        marginTop: 20,
        flexDirection: 'row',
         justifyContent: 'center'
    },
    footerText: {
        color: richBlack
    },
    signInLinkText: {
        color: sienna,
        fontWeight: 'bold',
        marginLeft: 5,
    },
});