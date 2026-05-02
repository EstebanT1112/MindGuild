import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { X } from 'lucide-react-native';

export default function NewQuestionModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const [type, setType] = useState<'mc' | 'dev'>('mc');
    const [selectedOption, setSelectedOption] = useState<number | null>(0); // Opción A por defecto

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Nueva Pregunta</Text>
                        <Pressable onPress={onClose} style={styles.closeBtn}><X color="white" size={20} /></Pressable>
                    </View>

                    <Text style={styles.label}>Tipo de Pregunta</Text>
                    <View style={styles.typeRow}>
                        <Pressable style={[styles.typeBtn, type === 'mc' && styles.typeBtnActive]} onPress={() => setType('mc')}>
                            <Text style={[styles.typeText, type === 'mc' && { color: 'white' }]}>Multiple Choice</Text>
                        </Pressable>
                        <Pressable style={[styles.typeBtn, type === 'dev' && styles.typeBtnActive]} onPress={() => setType('dev')}>
                            <Text style={[styles.typeText, type === 'dev' && { color: 'white' }]}>Desarrollo</Text>
                        </Pressable>
                    </View>

                    <Text style={styles.label}>Pregunta</Text>
                    <TextInput style={styles.input} placeholder="Escribe tu pregunta aquí..." placeholderTextColor="#4b5563" multiline />

                    {type === 'mc' ? (
                        <View style={{ marginTop: 15 }}>
                            <Text style={styles.label}>Opciones</Text>
                            {['A', 'B', 'C', 'D'].map((opt, i) => (
                                <Pressable 
                                    key={opt} 
                                    style={styles.optionRow} 
                                    onPress={() => setSelectedOption(i)} // <-- Lógica para seleccionar correcta
                                >
                                    <View style={[styles.radio, selectedOption === i && styles.radioActive]} />
                                    <TextInput 
                                        style={styles.optionInput} 
                                        placeholder={`Opción ${opt}`} 
                                        placeholderTextColor="#4b5563" 
                                    />
                                </Pressable>
                            ))}
                            <Text style={styles.hint}>Selecciona la respuesta correcta</Text>
                        </View>
                    ) : (
                        <View style={{ marginTop: 15 }}>
                            <Text style={styles.label}>Respuesta Esperada</Text>
                            <TextInput style={[styles.input, { height: 80 }]} placeholder="Escribe la respuesta..." placeholderTextColor="#4b5563" multiline />
                        </View>
                    )}

                    <Pressable style={styles.addBtn} onPress={onClose}>
                        <Text style={styles.addBtnText}>Agregar Pregunta</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
    content: { backgroundColor: '#1e293b', borderRadius: 32, padding: 25 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
    label: { color: '#94a3b8', fontSize: 13, fontWeight: 'bold', marginBottom: 10 },
    typeRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    typeBtn: { flex: 1, backgroundColor: '#0f172a', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
    typeBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    typeText: { color: '#64748b', fontWeight: 'bold' },
    input: { backgroundColor: '#0f172a', color: 'white', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#334155' },
    optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#4b5563' },
    radioActive: { borderColor: '#22c55e', backgroundColor: '#22c55e' },
    optionInput: { flex: 1, backgroundColor: '#0f172a', color: 'white', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
    hint: { color: '#64748b', fontSize: 12, marginTop: 5, textAlign: 'center' },
    addBtn: { backgroundColor: '#22c55e', padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 25 },
    addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});