import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    StatusBar,
    SafeAreaView,
    Modal,
    Platform,
    Alert,
    Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { firestore } from './firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    doc,
    query,
    orderBy,
    getDoc
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigation } from '@react-navigation/native';
 import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
 import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { AdvancedImage } from '@cloudinary/react';


// Color Palette
const richBlack = '#001524';
const caribbeanCurrent = '#15616D';
const papayaWhip = '#FFECD1';
const orangeWheel = '#FF7D00';
const sienna = '#78290F';
const lightGray = '#eee';
const darkGray = '#333';

const TaskItem = ({ task, onEdit, onDelete, onToggleComplete, setSelectedTask, setSubtaskModalVisible }) => {
    const taskColor =
        task.priority === 'Low'
            ? caribbeanCurrent
            : task.priority === 'Medium'
                ? orangeWheel
                : sienna;

    const handleSubtaskOpen = () => {
        console.log("Attempting to open subtasks for task:", task);
        if (task && task.subtasks && task.subtasks.length > 0) {
            setSelectedTask(task);
             setSubtaskModalVisible(true);
        }
         else {
            Alert.alert('No Subtasks', 'This task has no subtasks to show.');
        }

    };

    return (
        <TouchableOpacity style={[styles.taskItem, { backgroundColor: taskColor }]} onPress={handleSubtaskOpen}>
            <View style={styles.taskItemContent}>
                <TouchableOpacity style={[styles.taskCheckbox, task.completed && styles.taskCheckboxComplete]} onPress={onToggleComplete}>
                    {task.completed && <Feather name="check" size={16} color={papayaWhip} />}
                </TouchableOpacity>
                <Text style={[styles.taskTitle, task.completed && styles.taskTitleComplete]}>{task.title}</Text>
                <View style={styles.taskActions}>
                    <TouchableOpacity style={styles.taskActionsButton} onPress={onEdit}>
                        <Feather name="edit-2" size={20} color={papayaWhip} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.taskActionsButton} onPress={onDelete}>
                        <Feather name="x-circle" size={20} color={papayaWhip} />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.taskDetails}>
                <Text style={styles.taskCategory}>{task.category}</Text>
                <Text style={styles.taskDate}>{task.date}</Text>
            </View>
        </TouchableOpacity>
    );
};


const HomeScreen = () => {
    const [searchText, setSearchText] = useState('');
    const [tasks, setTasks] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [subtaskModalVisible, setSubtaskModalVisible] = useState(false);
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskSubtasks, setNewTaskSubtasks] = useState('');
    const [newTaskDate, setNewTaskDate] = useState(new Date());
    const [newTaskPriority, setNewTaskPriority] = useState('Low');
    const [newTaskCategory, setNewTaskCategory] = useState('Work');
    const [editMode, setEditMode] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [user, setUser] = useState(null);
    const navigation = useNavigation();
       const [avatarUrl, setAvatarUrl] = useState(null);
        const cld = new Cloudinary({ cloud: { cloudName: 'dxwkpqtey' } });


    const priorities = ['Low', 'Medium', 'High'];
    const categories = ['Work', 'Fun', 'Personal'];

    const handleProfileOpen = () => {
        setProfileModalVisible(true)
    };
    const handleProfileClose = () => {
        setProfileModalVisible(false)
    };
     useEffect(() => {
          const auth = getAuth();
          const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
             console.log("current user is", user);
             if(user?.uid) {
                  const userRef = doc(firestore, "users", user.uid);
                 const userSnap = await getDoc(userRef);
                if(userSnap.exists()) {
                   const userData = userSnap.data();
                   if(userData.avatarUrl) {
                        setAvatarUrl(userData.avatarUrl)
                     } else {
                         setAvatarUrl(null)
                     }
                }
           }
          });
          return () => {
            unsubscribe();
          };
      }, []);
    useEffect(() => {
        if(!user?.uid) return;
        const unsubscribe = onSnapshot(
          query(collection(firestore, `users/${user.uid}/tasks`), orderBy("priority")),
          (querySnapshot) => {
            const tasksData = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));
            setTasks(tasksData);
            console.log("Fetched Data", tasksData);
          },
           (error) => {
            console.error("Error fetching tasks:", error);
            Alert.alert(
              "Error",
              "Failed to fetch tasks. Please check your connection and try again."
            );
          }
        );
        return () => {
          unsubscribe();
        };
    }, [user]);


    const addTask = () => {
        setIsModalVisible(true);
        setEditMode(false);
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskSubtasks('');
        setNewTaskDate(new Date());
        setNewTaskPriority('Low');
        setNewTaskCategory('Work');
    };
     const saveTask = async () => {
        if (!newTaskTitle.trim()) {
            Alert.alert('Error', 'Task description cannot be empty.');
            return;
        }
        const isDuplicate = tasks.some(
            (task) => task.title.toLowerCase() === newTaskTitle.trim().toLowerCase()
        );
        if (isDuplicate && !(editMode && taskToEdit)) {
            Alert.alert('Error', 'This task already exists.');
            return;
        }
        const formattedDate = `${newTaskDate.getDate().toString().padStart(2, '0')}/${(newTaskDate.getMonth() + 1).toString().padStart(2, '0')}/${newTaskDate.getFullYear()}`;
        const subtasks = newTaskSubtasks.trim() ? newTaskSubtasks.split(',').map(s => ({name: s.trim(), completed: false})) : [];
        try {
            if (editMode && taskToEdit) {
                const taskRef = doc(firestore, `users/${user.uid}/tasks`, taskToEdit.id);
                await updateDoc(taskRef, {
                   title: newTaskTitle,
                    date: formattedDate,
                    priority: newTaskPriority,
                    category: newTaskCategory,
                    description: newTaskDescription,
                    subtasks: subtasks,
                })
            }
             else {
              await addDoc(collection(firestore, `users/${user.uid}/tasks`), {
                   title: newTaskTitle,
                  date: formattedDate,
                  priority: newTaskPriority,
                  category: newTaskCategory,
                  completed: false,
                  description: newTaskDescription,
                  subtasks: subtasks,
              });
            }
            setIsModalVisible(false);
            setNewTaskTitle('');
            setNewTaskDescription('');
            setNewTaskSubtasks('');
            setNewTaskDate(new Date());
            setNewTaskPriority('Low');
            setNewTaskCategory('Work');
            setEditMode(false);
            setTaskToEdit(null);
        } catch (e) {
            console.error("Error saving task:", e);
            Alert.alert("Error", "Failed to save task. Please try again.");
        }
    };

    const cancelTask = () => {
        setIsModalVisible(false);
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskSubtasks('');
        setNewTaskDate(new Date());
        setNewTaskPriority('Low');
        setNewTaskCategory('Work');
        setEditMode(false);
        setTaskToEdit(null);
    };

    const showDatepickerModal = () => {
        setShowDatePicker(true);
    };

    const hideDatepickerModal = () => {
        setShowDatePicker(false);
    };

    const onDateChange = (event, selectedDate) => {
        hideDatepickerModal();
        if (selectedDate) {
            const now = new Date();
            if (selectedDate < now) {
                Alert.alert('Invalid Date', 'Task date cannot be in the past.');
                return;
            }
            setNewTaskDate(selectedDate);
        }
    };

    const handleToggleComplete = async (taskId) => {
        try {
            const taskRef = doc(firestore, `users/${user.uid}/tasks`, taskId);
            const taskSnapshot = await getDoc(taskRef);
            if (taskSnapshot.exists()) {
               const taskData = taskSnapshot.data();
                const newCompleted = !taskData.completed;
                const updatedSubtasks = taskData.subtasks.map(subtask => ({ ...subtask, completed: newCompleted }));
                await updateDoc(taskRef, {
                   completed: newCompleted,
                    subtasks: updatedSubtasks,
                });
                console.log("Task Status Updated successfully")
           } else {
               console.log("Task does not exist");
           }
        } catch (e) {
            console.error("Error toggling task status:", e);
            Alert.alert("Error", "Failed to toggle task status. Please try again.");
        }
    };

  const handleEditTask = async (task) => {
        if (task.completed) {
            Alert.alert('Cannot Edit', 'Please untick the task for editing.');
            return;
        }
        setTaskToEdit(task);
        setNewTaskTitle(task.title);
        setNewTaskDescription(task.description);
        setNewTaskSubtasks(task.subtasks.map(sub => sub.name).join(','));
        const taskDate = new Date(task.date);
        if (isNaN(taskDate.getTime())) {
            setNewTaskDate(new Date());
        } else {
            setNewTaskDate(taskDate);
        }
        setNewTaskPriority(task.priority);
        setNewTaskCategory(task.category);
        setIsModalVisible(true);
        setEditMode(true);
    };

    const handleSubtaskClose = () => {
        setSubtaskModalVisible(false);
        setSelectedTask(null);
    };
     const handleToggleSubtaskComplete = async (subtaskIndex) => {
            if (!selectedTask || !selectedTask.subtasks) return;
            try {
                const taskRef = doc(firestore, `users/${user.uid}/tasks`, selectedTask.id);
                const taskSnapshot = await getDoc(taskRef);
               if (taskSnapshot.exists()) {
                   const taskData = taskSnapshot.data();
                   const updatedSubtasks = taskData.subtasks.map((subtask, index) =>
                       index === subtaskIndex ? { ...subtask, completed: !subtask.completed } : subtask
                   );
                    const allSubtasksCompleted = updatedSubtasks.every(subtask => subtask.completed);
                    await updateDoc(taskRef, {
                        subtasks: updatedSubtasks,
                        completed: allSubtasksCompleted
                     });
                   setSelectedTask(prev => ({...prev, subtasks: updatedSubtasks}))
               } else {
                  console.log("Task does not exists");
               }
           } catch(e) {
               console.error("Error toggling subtask status:", e);
              Alert.alert("Error", "Failed to toggle subtask status. Please try again.");
          }
     };


   const handleDeleteTask = async (taskId) => {
        try {
            const taskRef = doc(firestore, `users/${user.uid}/tasks`, taskId);
            await deleteDoc(taskRef);
       } catch (e) {
           console.error("Error deleting task:", e);
           Alert.alert("Error", "Failed to delete the task. Please try again.");
       }
   };
     const handleLogout = async () => {
         try {
              const auth = getAuth();
              await signOut(auth);
              navigation.navigate('SignIn');
              setAvatarUrl(null);
             setProfileModalVisible(false)

          } catch (e) {
             console.error("Error logging out:", e);
              Alert.alert("Error", "Failed to log out. Please try again.");
          }
     };
    const chooseImage = async () => {
         try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status === 'granted') {
              const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                   aspect: [1, 1],
                    quality: 1,
              });
               if(!result.canceled && result.assets && result.assets.length > 0) {
                   const selectedImage = result.assets[0];
                     setAvatarUrl(selectedImage.uri)
                     if(user?.uid) {
                       const imageUrl = await uploadImageToCloudinary(selectedImage.uri, user);
                       if(imageUrl) {
                           setAvatarUrl(imageUrl)
                           const userRef = doc(firestore, "users", user.uid);
                                await updateDoc(userRef, {
                                     avatarUrl: imageUrl
                                  })
                           }

                     } else {
                       Alert.alert("User not found", "Please login to upload your image")
                    }
                }
            } else {
                Alert.alert("Permission Error", "Permission for media access was not granted");
            }

        } catch (e) {
            console.log("Error Selecting Image", e);
            Alert.alert("Error", "Error Selecting image please try again");
        }
    };
    const uploadImageToCloudinary = async (imageUri, user) => {
    try {
        const filename = `profilePic_${user.uid}_${new Date().getTime()}`;
        const formData = new FormData();
         formData.append('file', {
                uri: imageUri,
               type: 'image/jpeg', // Adjust if necessary
                name: filename
             });
            formData.append("upload_preset", "everdo");
        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/dxwkpqtey/image/upload`;


        const response = await fetch(cloudinaryUrl, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();


        if (data && data.secure_url) {
            console.log('Image URL:', data.secure_url);
            return data.secure_url;
        } else {
            console.error('Error uploading image:', data.error && data.error.message);
            Alert.alert('Error Uploading', 'Failed to upload image, please try again.')
            return null;

        }
    } catch (error) {
       console.error('Error:', error);
       Alert.alert("Error", 'Error uploading Image, please try again')
           return null;
    }
};
    const filterTasks = () => {
        switch (filterType) {
            case 'completed':
                return tasks.filter(task => task.completed);
            case 'pending':
                return tasks.filter(task => !task.completed);
            default:
                return tasks;
        }
    };
    const sortTasks = (filteredTasks) => {
        const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        return [...filteredTasks].sort((a, b) => {
            if (a.completed && !b.completed) return 1;
            if (!a.completed && b.completed) return -1;
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    };
    const filterCompleted = () => {
        setFilterType('completed');
    };
    const filterPending = () => {
        setFilterType('pending');
    };
    const filterAll = () => {
        setFilterType('all');
    };
    const filteredTasks = filterTasks();
    const sortedTasks = useMemo(() => sortTasks(filteredTasks), [filteredTasks]);
    const handleSearch = (text) => {
        setSearchText(text);
        setFilterType('all');
    };
    const searchedTasks = useMemo(() => {
        if (!searchText) return sortedTasks;
        const searchLower = searchText.toLowerCase();
        return sortedTasks.filter((task) => {
            const subtaskMatch = task.subtasks?.some(sub => sub.name.toLowerCase().includes(searchLower));
            return (
              task.title.toLowerCase().includes(searchLower) ||
              (task.description && task.description.toLowerCase().includes(searchLower)) ||
              task.priority.toLowerCase().includes(searchLower) ||
              task.date.toLowerCase().includes(searchLower) ||
              task.category.toLowerCase().includes(searchLower) ||
              subtaskMatch
            );
        });
    }, [searchText, sortedTasks]);
    const handleSettingsOpen = () => {
        setSettingsModalVisible(true)
    };
    const handleSettingsClose = () => {
        setSettingsModalVisible(false)
    };

      const completedTasksCount = useMemo(() => tasks.filter(task => task.completed).length, [tasks]);
    const totalTasksCount = useMemo(() => tasks.length, [tasks]);
    const remainingTasksCount = useMemo(() => totalTasksCount - completedTasksCount, [totalTasksCount, completedTasksCount]);
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar
                animated={true}
                backgroundColor={caribbeanCurrent}
                barStyle="light-content"
                translucent={false}
            />
            <View style={styles.container}>
                <View style={styles.headerBackground}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.settingsIcon} onPress={handleSettingsOpen}>
                            <Feather name="settings" size={24} color={papayaWhip} />
                        </TouchableOpacity>
                        <Text style={styles.title}>EverDo</Text>
                        <TouchableOpacity style={styles.profileIcon} onPress={handleProfileOpen}>
                            <Feather name="user" size={24} color={papayaWhip} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.searchBarContainer}>
                    <Feather name="search" size={20} color={darkGray} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchBar}
                        placeholder="Search tasks"
                        value={searchText}
                        onChangeText={handleSearch}
                    />
                </View>
                {/* Progress Tracker added here */}
                 <View style={styles.progressTracker}>
                    <Text style={styles.progressText}>
                        {completedTasksCount} / {totalTasksCount} Tasks Completed
                    </Text>
                    {totalTasksCount > 0 && (
                      <View style={styles.progressBar}>
                          <View style={[styles.progressBarFill, { width: `${(completedTasksCount / totalTasksCount) * 100}%` }]} />
                        </View>
                    )}
                 </View>
                 <View style={styles.filterButtons}>
                    <TouchableOpacity onPress={filterAll} style={styles.filterButton}>
                        <Text style={styles.filterButtonText}>All Tasks</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={filterCompleted} style={styles.filterButton}>
                        <Text style={styles.filterButtonText}>Completed</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={filterPending} style={styles.filterButton}>
                        <Text style={styles.filterButtonText}>Pending</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView style={styles.taskList}>
                    {searchedTasks.map((task) => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onEdit={() => handleEditTask(task)}
                            onDelete={() => handleDeleteTask(task.id)}
                            onToggleComplete={() => handleToggleComplete(task.id)}
                            setSelectedTask = {setSelectedTask}
                            setSubtaskModalVisible = {setSubtaskModalVisible}
                        />
                    ))}
                </ScrollView>
                <TouchableOpacity style={styles.addButton} onPress={addTask}>
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
                <Modal
                    visible={isModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={cancelTask}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>{editMode ? 'Edit Task' : 'Add New Task'}</Text>
                            <View style={styles.modalInputContainer}>
                                <Text style={styles.modalLabel}>Task Description</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Task Description"
                                    value={newTaskTitle}
                                    onChangeText={setNewTaskTitle}
                                    multiline
                                />
                            </View>
                              <View style={styles.modalInputContainer}>
                                <Text style={styles.modalLabel}>Subtasks (comma separated)</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Subtasks"
                                    value={newTaskSubtasks}
                                    onChangeText={setNewTaskSubtasks}
                                    multiline
                                />
                            </View>
                            <View style={styles.modalInputContainer}>
                                <Text style={styles.modalLabel}>Date</Text>
                                <TouchableOpacity onPress={showDatepickerModal}
                                    style={styles.datePicker}>
                                    <Text style={styles.dateText}>
                                        {`${newTaskDate.getDate().toString().padStart(2, '0')}/${(newTaskDate.getMonth() + 1).toString().padStart(2, '0')}/${newTaskDate.getFullYear()}`}
                                    </Text>
                                    <Feather name="calendar" size={20} color={darkGray} />
                                </TouchableOpacity>
                            </View>
                            {showDatePicker && (
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={newTaskDate}
                                    mode="date"
                                    display="default"
                                    onChange={onDateChange}
                                />
                            )}
                            <View style={styles.modalInputContainer}>
                                <Text style={styles.modalLabel}>Priority</Text>
                                <View style={styles.optionsContainer}>
                                    {priorities.map((priority) => (
                                        <TouchableOpacity
                                            key={priority}
                                            style={[
                                                styles.modalOption,
                                                newTaskPriority === priority &&
                                                styles.modalOptionSelected,
                                            ]}
                                            onPress={() => setNewTaskPriority(priority)}
                                        >
                                            <Text
                                                style={[
                                                    styles.modalOptionText,
                                                    newTaskPriority === priority &&
                                                    styles.modalOptionSelectedText,
                                                ]}
                                            >
                                                {priority}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                            <View style={styles.modalInputContainer}>
                                <Text style={styles.modalLabel}>Category</Text>
                                <View style={styles.optionsContainer}>
                                    {categories.map((category) => (
                                        <TouchableOpacity
                                            key={category}
                                            style={[
                                                styles.modalOption,
                                                newTaskCategory === category &&
                                                styles.modalOptionSelected,
                                            ]}
                                            onPress={() => setNewTaskCategory(category)}
                                        >
                                            <Text
                                                style={[
                                                    styles.modalOptionText,
                                                    newTaskCategory === category &&
                                                    styles.modalOptionSelectedText,
                                                ]}
                                            >
                                                {category}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                            <View style={styles.modalButtonContainer}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.saveButton]}
                                    onPress={saveTask}
                                >
                                    <Text style={styles.modalButtonText}>{editMode ? 'Save Task' : 'Add Task'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={cancelTask}
                                >
                                    <Text style={styles.modalButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
                <Modal
                    visible={subtaskModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={handleSubtaskClose}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <View>
                                    <Text style={styles.modalTitle}>Subtasks for: {selectedTask?.title}</Text>
                                    {selectedTask?.subtasks?.map((subtask, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.subtaskItem}
                                            onPress={() => handleToggleSubtaskComplete(index)}
                                        >
                                            <View style={[styles.subtaskCheckbox, subtask.completed && styles.taskCheckboxComplete]}>
                                                {subtask.completed && <Feather name="check" size={16} color={richBlack} />}
                                            </View>
                                            <Text style={styles.subtaskText}> {subtask.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.saveButton]}
                                        onPress={handleSubtaskClose}
                                    >
                                        <Text style={styles.modalButtonText}>Return</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                <Modal
                    visible={profileModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={handleProfileClose}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>User Profile</Text>
                                  <View style={styles.profileAvatarContainer}>
                                     {avatarUrl ? (
                                          <AdvancedImage
                                             cldImg={cld.image(avatarUrl).resize(auto().gravity(autoGravity()).width(100).height(100))}
                                              style={styles.avatarImage}
                                          />
                                     ) : (
                                          <View style={styles.avatarPlaceholder}>
                                                <Feather name="user" size={60} color={lightGray} />
                                            </View>
                                      )}
                                        <TouchableOpacity style={styles.selectAvatarButton} onPress={chooseImage}>
                                         <Text style={styles.selectAvatarText}>{avatarUrl ? "Change Avatar" : "Select Avatar"}</Text>
                                         
                                        </TouchableOpacity>
                                    </View>
                            {user && (
                                <View style={styles.profileInfo}>
                                    <Text style={styles.profileText}>Email: {user.email}</Text>
                                </View>
                            )}
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={handleLogout}
                            >
                                <Text style={styles.modalButtonText}>Logout</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleProfileClose}
                            >
                                <Text style={styles.modalButtonText}>Return</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
                <Modal
                    visible={settingsModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={handleSettingsClose}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>App Settings</Text>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSettingsClose}
                            >
                                <Text style={styles.modalButtonText}>Return</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
};

export default HomeScreen;



const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: richBlack,
    },
    container: {
        flex: 1,
        backgroundColor: papayaWhip,
    },
    headerBackground: {
        backgroundColor: caribbeanCurrent,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
     settingsIcon: {
        padding: 10,
    },
    profileIcon: {
        padding: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: papayaWhip,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: lightGray,
        borderRadius: 8,
        margin: 15,
        paddingHorizontal: 10,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchBar: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: darkGray,
    },
       progressTracker: {
        paddingHorizontal: 15,
         marginBottom: 10,
    },
    progressText: {
        fontSize: 14,
        color: darkGray,
         textAlign: 'center',
    },
     progressBar: {
        height: 8,
        backgroundColor: lightGray,
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 5,
    },
     progressBarFill: {
      height: '100%',
       backgroundColor: caribbeanCurrent,
    },
    filterButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
        paddingHorizontal: 15,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        backgroundColor: caribbeanCurrent,
        elevation: 2,
         marginHorizontal: 5, // Added margin for filter buttons spacing
    },
    filterButtonText: {
        color: papayaWhip,
        fontSize: 14,
        fontWeight: '500',
    },
    taskList: {
        flex: 1,
        paddingHorizontal: 15,
    },
    taskItem: {
        backgroundColor: caribbeanCurrent,
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 3,
    },
    taskItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    taskCheckbox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: papayaWhip,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    taskCheckboxComplete: {
        backgroundColor: papayaWhip,
    },
    taskTitle: {
        flex: 1,
        fontSize: 18,
        color: papayaWhip,
        textDecorationLine: 'none',
    },
    taskTitleComplete: {
        textDecorationLine: 'line-through',
        color: lightGray,
    },
    taskActions: {
        flexDirection: 'row',
          marginLeft: 10, // Added spacing for the edit/delete buttons
    },
     taskActionsButton: {
      marginLeft: 5, // Adding spacing within actions buttons
    },
    taskDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    taskCategory: {
        fontSize: 14,
        color: lightGray,
    },
    taskDate: {
        fontSize: 14,
        color: lightGray,
    },
    addButton: {
        backgroundColor: orangeWheel,
        borderRadius: 30,
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 20,
        right: 20,
        elevation: 5,
    },
    addButtonText: {
        fontSize: 30,
        color: papayaWhip,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: papayaWhip,
        padding: 20,
        borderRadius: 10,
        width: '90%',
        maxHeight: '90%',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: darkGray,
        textAlign: 'center',
    },
    modalInputContainer: {
        marginBottom: 15,
    },
    modalLabel: {
        fontSize: 16,
        marginBottom: 5,
        color: darkGray,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: darkGray,
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
        color: darkGray,
    },
     datePicker: {
        flexDirection: 'row',
        justifyContent: 'space-between',
         alignItems: 'center',
         borderWidth: 1,
        borderColor: darkGray,
         borderRadius: 5,
         padding: 10,
        fontSize: 16,
        color: darkGray
    },
     dateText: {
        fontSize: 16,
        color: darkGray,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    modalOption: {
        backgroundColor: lightGray,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: darkGray,
    },
    modalOptionSelected: {
        backgroundColor: orangeWheel,
    },
    modalOptionText: {
        fontSize: 16,
        color: darkGray,
    },
    modalOptionSelectedText: {
        color: papayaWhip,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginLeft: 10,
        alignItems: 'center',
         marginHorizontal: 5, // Adding spacing to modal buttons
    },
     saveButton: {
        backgroundColor: caribbeanCurrent,
    },
     cancelButton: {
        backgroundColor: sienna,
    },
    modalButtonText: {
        color: papayaWhip,
        fontSize: 16,
        fontWeight: '500',
    },
    subtaskItem: {
        flexDirection: 'row',
         paddingVertical: 5,
        alignItems: 'center',
    },
    subtaskCheckbox: {
        width: 20,
         height: 20,
        borderRadius: 10,
        borderWidth: 2,
         borderColor: richBlack,
         alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    subtaskText: {
      flex: 1,
        fontSize: 16,
         color: darkGray,
    },
    profileInfo: {
        marginBottom: 15,
    },
    profileText: {
        fontSize: 16,
        color: darkGray,
    },
    profileAvatarContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
     avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: darkGray,
       justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden'
    },
    selectAvatarButton: {
      padding: 10,
        borderRadius: 5,
       marginTop: 10,
        backgroundColor: caribbeanCurrent,
    },
     selectAvatarText: {
      fontSize: 14,
      color: papayaWhip
    },
});