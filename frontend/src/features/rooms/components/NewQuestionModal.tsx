import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { createRoomQuestion, type BattleQuestionType } from '../services/battleRoyaleService';

interface NewQuestionModalProps {
    visible: boolean;
    onClose: () => void;
    accessToken?: string | null;
    roomId?: string | null;
    onCreated: () => void;
}

export default function NewQuestionModal({
    visible,
    onClose,
    accessToken,
    roomId,
    onCreated,
}: NewQuestionModalProps) {
    const [type, setType] = useState<BattleQuestionType>('multiple_choice');
    const [questionText, setQuestionText] = useState('');
    const [expectedAnswer, setExpectedAnswer] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [selectedOption, setSelectedOption] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!visible) return;
        reset();
    }, [visible]);

    const reset = () => {
        setType('multiple_choice');
        setQuestionText('');
        setExpectedAnswer('');
        setOptions(['', '', '', '']);
        setSelectedOption(0);
        setSaving(false);
    };

    const handleOptionChange = (index: number, value: string) => {
        setOptions(current => current.map((option, i) => (i === index ? value : option)));
    };

    const handleSubmit = async () => {
        if (!accessToken || !roomId) return;

        const trimmedQuestion = questionText.trim();

        if (!trimmedQuestion) {
            Alert.alert('Pregunta requerida', 'Escribi el enunciado de la pregunta.');
            return;
        }

        const payload = type === 'multiple_choice'
            ? {
                type,
                question_text: trimmedQuestion,
                options: options
                    .map((option, index) => ({
                        option_text: option.trim(),
                        is_correct: index === selectedOption,
                    }))
                    .filter(option => option.option_text.length > 0),
            }
            : {
                type,
                question_text: trimmedQuestion,
                expected_answer: expectedAnswer.trim(),
            };

        setSaving(true);
        try {
            await createRoomQuestion(accessToken, roomId, payload);
            onCreated();
            reset();
            onClose();
        } catch (error: any) {
            Alert.alert('No se pudo crear la pregunta', error.message ?? 'Revisa los datos e intenta nuevamente.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Nueva Pregunta</Text>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <X color="white" size={20} />
                        </Pressable>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.label}>Tipo de pregunta</Text>
                        <View style={styles.typeRow}>
                            <Pressable
                                style={[styles.typeBtn, type === 'multiple_choice' && styles.typeBtnActive]}
                                onPress={() => setType('multiple_choice')}
                            >
                                <Text style={[styles.typeText, type === 'multiple_choice' && styles.typeTextActive]}>
                                    Multiple Choice
                                </Text>
                            </Pressable>
                            <Pressable
                                style={[styles.typeBtn, type === 'open' && styles.typeBtnActive]}
                                onPress={() => setType('open')}
                            >
                                <Text style={[styles.typeText, type === 'open' && styles.typeTextActive]}>
                                    Desarrollo
                                </Text>
                            </Pressable>
                        </View>

                        <Text style={styles.label}>Pregunta</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Escribe tu pregunta..."
                            placeholderTextColor="#4b5563"
                            multiline
                            value={questionText}
                            onChangeText={setQuestionText}
                        />

                        {type === 'multiple_choice' ? (
                            <View style={{ marginTop: 15 }}>
                                <Text style={styles.label}>Opciones</Text>
                                {options.map((option, index) => (
                                    <Pressable
                                        key={index}
                                        style={styles.optionRow}
                                        onPress={() => setSelectedOption(index)}
                                    >
                                        <View style={[styles.radio, selectedOption === index && styles.radioActive]}>
                                            {selectedOption === index && <Check color="white" size={12} />}
                                        </View>
                                        <TextInput
                                            style={styles.optionInput}
                                            placeholder={`Opcion ${index + 1}`}
                                            placeholderTextColor="#4b5563"
                                            value={option}
                                            onChangeText={value => handleOptionChange(index, value)}
                                        />
                                    </Pressable>
                                ))}
                                <Text style={styles.hint}>Selecciona exactamente una respuesta correcta.</Text>
                            </View>
                        ) : (
                            <View style={{ marginTop: 15 }}>
                                <Text style={styles.label}>Respuesta esperada</Text>
                                <TextInput
                                    style={[styles.input, styles.expectedArea]}
                                    placeholder="Escribe la respuesta esperada..."
                                    placeholderTextColor="#4b5563"
                                    multiline
                                    value={expectedAnswer}
                                    onChangeText={setExpectedAnswer}
                                />
                            </View>
                        )}

                        <Pressable
                            style={[styles.addBtn, saving && styles.disabledBtn]}
                            onPress={handleSubmit}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.addBtnText}>Agregar Pregunta</Text>
                            )}
                        </Pressable>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
    content: { backgroundColor: '#1e293b', borderRadius: 28, padding: 22, maxHeight: '88%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
    label: { color: '#94a3b8', fontSize: 13, fontWeight: 'bold', marginBottom: 10 },
    typeRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    typeBtn: { flex: 1, backgroundColor: '#0f172a', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
    typeBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    typeText: { color: '#64748b', fontWeight: 'bold', fontSize: 13 },
    typeTextActive: { color: 'white' },
    input: { backgroundColor: '#0f172a', color: 'white', padding: 14, borderRadius: 15, borderWidth: 1, borderColor: '#334155' },
    textArea: { minHeight: 86, textAlignVertical: 'top' },
    expectedArea: { minHeight: 110, textAlignVertical: 'top' },
    optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#4b5563', alignItems: 'center', justifyContent: 'center' },
    radioActive: { borderColor: '#22c55e', backgroundColor: '#22c55e' },
    optionInput: { flex: 1, backgroundColor: '#0f172a', color: 'white', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
    hint: { color: '#64748b', fontSize: 12, marginTop: 5, textAlign: 'center' },
    addBtn: { backgroundColor: '#22c55e', height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 25 },
    disabledBtn: { opacity: 0.7 },
    addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
