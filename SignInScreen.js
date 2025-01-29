import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from './firebase'; // Adjust the path to your Firebase config
import { Feather } from '@expo/vector-icons';

// Color Palette
const richBlack = '#001524';
const caribbeanCurrent = '#15616D';
const papayaWhip = '#FFECD1';
const orangeWheel = '#FF7D00';
const sienna = '#78290F';
const lightGray = '#eee';
const darkGray = '#333';

export default function SignInScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [isResetModalVisible, setResetModalVisible] = useState(false);

    const validateEmail = (email) => {
        if (!email) {
            return "Email cannot be empty.";
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) ? '' : 'Invalid email format';
    };

    const validatePassword = (password) => {
        if (!password) {
            return "Password cannot be empty.";
        } else if (password.length < 6) {
            return "Password must be at least 6 characters long";
        }
        return "";
    };

    const handleSignIn = async () => {
        const emailErr = validateEmail(email);
        const passwordErr = validatePassword(password);

        setEmailError(emailErr);
        setPasswordError(passwordErr);
        if (emailErr || passwordErr) {
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            Alert.alert("Success", "Logged in successfully.");
            navigation.navigate("Home");
        } catch (error) {
            console.error("SignIn Error: ", error);
            Alert.alert("SignIn Failed", error.message);
        }
    };

    const handlePasswordReset = async () => {
        const emailErr = validateEmail(resetEmail);
        if (emailErr) {
            Alert.alert("Error", emailErr);
            return;
        }

        try {
            await sendPasswordResetEmail(auth, resetEmail);
            Alert.alert("Success", "Password reset email sent.");
            setResetModalVisible(false);
        } catch (error) {
            console.error("Password Reset Error: ", error);
            Alert.alert("Error", "Failed to send password reset email. Please try again.");
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
                placeholderTextColor={darkGray}
                onBlur={() => setEmailError(validateEmail(email))}
            />
            {emailError && <Text style={styles.errorText}>{emailError}</Text>}

            <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={darkGray}
                onBlur={() => setPasswordError(validatePassword(password))}
            />
            {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

            <TouchableOpacity
                style={styles.signInButton}
                onPress={handleSignIn}
            >
                <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => setResetModalVisible(true)}
                style={styles.forgotPasswordButton}
            >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                    <Text style={styles.signUpLinkText}>Sign Up</Text>
                </TouchableOpacity>
            </View>

            {/* Password Reset Modal */}
            <Modal
                visible={isResetModalVisible}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reset Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email address"
                            value={resetEmail}
                            onChangeText={setResetEmail}
                            keyboardType="email-address"
                            placeholderTextColor={darkGray}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={handlePasswordReset}
                            >
                                <Text style={styles.buttonText}>Reset</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setResetModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        marginTop: 10,
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
        marginBottom: 5,
    },
    signInButton: {
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
    forgotPasswordButton: {
        marginTop: 10,
        alignItems: 'center',
    },
    forgotPasswordText: {
        color: caribbeanCurrent,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerText: {
        color: richBlack,
    },
    signUpLinkText: {
        color: sienna,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: papayaWhip,
        padding: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: richBlack,
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: 20,
    },
    modalButton: {
        backgroundColor: caribbeanCurrent,
        padding: 10,
        borderRadius: 8,
        marginHorizontal: 10,
    },
    cancelButton: {
        backgroundColor: sienna,
    },
});
