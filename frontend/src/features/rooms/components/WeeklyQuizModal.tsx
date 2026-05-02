import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { X } from 'lucide-react-native';

export default function WeeklyQuizModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const [step, setStep] = useState(1);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null); // <-- Estado para el Quiz

    const handleClose = () => {
        setStep(1);
        setSelectedAnswer(null);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Quiz Semanal</Text>
                        <Pressable onPress={handleClose} style={styles.closeBtn}><X color="white" size={20} /></Pressable>
                    </View>

                    <View style={styles.progressRow}>
                        <Text style={styles.stepText}>Pregunta {step} de 2</Text>
                        <View style={styles.dots}>
                            <View style={[styles.dot, step >= 1 && { backgroundColor: '#a855f7' }]} />
                            <View style={[styles.dot, step >= 2 && { backgroundColor: '#a855f7' }]} />
                        </View>
                    </View>

                    <View style={styles.quizCard}>
                        <Text style={styles.questionText}>
                            {step === 1 ? "¿Cuál es la derivada de x²?" : "Explica el teorema fundamental del cálculo"}
                        </Text>

                        {step === 1 ? (
                            <View>
                                {['x', '2x', 'x²', '2'].map(opt => (
                                    <Pressable 
                                        key={opt} 
                                        style={[styles.optionBtn, selectedAnswer === opt && styles.optionBtnActive]} 
                                        onPress={() => setSelectedAnswer(opt)} // <-- Seleccionar respuesta
                                    >
                                        <View style={[styles.radio, selectedAnswer === opt && styles.radioActive]} />
                                        <Text style={styles.optLabel}>{opt}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        ) : (
                            <TextInput style={styles.textArea} placeholder="Escribe tu respuesta aquí..." placeholderTextColor="#4b5563" multiline />
                        )}
                    </View>

                    <Pressable 
                        style={[styles.nextBtn, step === 2 && { backgroundColor: '#22c55e' }]} 
                        onPress={() => {
                            if (step === 1) {
                                setStep(2);
                                setSelectedAnswer(null); // Limpiamos para la siguiente
                            } else {
                                handleClose();
                            }
                        }}
                    >
                        <Text style={styles.nextText}>{step === 2 ? "Finalizar Quiz" : "Siguiente"}</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', padding: 20 },
    content: { backgroundColor: '#0f172a', borderRadius: 32, padding: 25, borderWidth: 1, borderColor: '#a855f744' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    stepText: { color: '#64748b', fontSize: 13 },
    dots: { flexDirection: 'row', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#334155' },
    quizCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#a855f722', minHeight: 250 },
    questionText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0f172a', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
    optionBtnActive: { borderColor: '#a855f7' },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#4b5563' },
    radioActive: { borderColor: '#a855f7', backgroundColor: '#a855f7' },
    optLabel: { color: 'white', fontSize: 15 },
    textArea: { backgroundColor: '#0f172a', color: 'white', borderRadius: 15, padding: 15, height: 120, textAlignVertical: 'top' },
    nextBtn: { backgroundColor: '#6b21a8', padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 25 },
    nextText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});