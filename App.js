import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, TextInput, View, FlatList, TouchableOpacity, Button, Alert, Animated} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const animations = useRef(new Map()).current;
  const [editText, setEditText] = useState('');
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const loadedTasks = await AsyncStorage.getItem('tasks');
        if (loadedTasks) {
          const parsedTasks = JSON.parse(loadedTasks);
          parsedTasks.forEach(t => {
            animations[t.id] = new Animated.Value(1);
          });
          setTasks(parsedTasks);
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to load the tasks.');
      }
    };
    loadTasks();
  }, [animations]);

  const saveTasks = useCallback(async () => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (err) {
      Alert.alert('Error', 'Failed to save the tasks.');
    }
  }, [tasks]);

  useEffect(() => {
    saveTasks();
  }, [tasks, saveTasks]);

  const addTask = () => {
    if (task.trim()) {
      const newTask = { id: Date.now().toString(), text: task, completed: false };
      animations[newTask.id] = new Animated.Value(0);
      setTasks(prevTasks => [...prevTasks, newTask]);
      Animated.timing(animations[newTask.id], {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setTask('');
    }
  };

  const deleteTask = (taskId) => {
    Animated.timing(animations[taskId], {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
      delete animations[taskId];
    });
  };

  const toggleComplete = (taskId) => {
    setTasks(prevTasks =>
      prevTasks.map(currentTask =>
        currentTask.id === taskId ? { ...currentTask, completed: !currentTask.completed } : currentTask
      )
    );
  };
  const startEditing = (id, text) => {
    setEditId(id);
    setEditText(text);
  };
  const handleEdit = (id) => {
    setTasks(prevTasks =>
      prevTasks.map(currentTask =>
        currentTask.id === id ? { ...currentTask, text: editText } : currentTask
      )
    );
    setEditId(null);
    setEditText('');
  };

  const renderItem = ({ item }) => {
    const isEditing = item.id === editId;
    const opacity = animations[item.id].interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });
    return (
      <Animated.View style={[styles.taskContainer, { opacity }]}>
        {isEditing ? (
          <TextInput
            style={styles.input}
            onChangeText={setEditText}
            value={editText}
            onSubmitEditing={() => handleEdit(item.id)}
          />
        ) : (
          <TouchableOpacity onPress={() => toggleComplete(item.id)}>
            <Text style={[styles.taskText, item.completed ? styles.completedText : null]}>{item.text}</Text>
          </TouchableOpacity>
        )}
        {!isEditing && (
          <>
            <Button title="Edit" onPress={() => startEditing(item.id, item.text)} />
            <TouchableOpacity onPress={() => deleteTask(item.id)}>
              <Text style={styles.deleteButton}>X</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple To-Do List</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task"
          value={task}
          onChangeText={setTask}
        />
        <TouchableOpacity style={styles.addButton} onPress={addTask}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: '#5C5CFF',
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginLeft: 10,
  },
  taskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  deleteButton: {
    color: '#FF5C5C',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
