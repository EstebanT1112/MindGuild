import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, Plus, X } from 'lucide-react-native';
import {
    createRoomQuestion,
    createRoomTopic,
    fetchRoomTopics,
    type AcademicTopic,
    type BattleQuestionType,
    type CreateQuestionInput,
} from '../services/battleRoyaleService';

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
    const [topics, setTopics] = useState<AcademicTopic[]>([]);
    const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
    const [newTopicName, setNewTopicName] = useState('');
    const [topicsLoading, setTopicsLoading] = useState(false);
    const [creatingTopic, setCreatingTopic] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const reset = useCallback(() => {
        setType('multiple_choice');
        setQuestionText('');
        setExpectedAnswer('');
        setOptions(['', '', '', '']);
        setSelectedOption(0);
        setSelectedTopicIds([]);
        setNewTopicName('');
        setErrorMessage(null);
        setSaving(false);
    }, []);

    const loadTopics = useCallback(async () => {
        if (!accessToken || !roomId) return;

        setTopicsLoading(true);
        try {
            setTopics(await fetchRoomTopics(accessToken, roomId));
        } catch (error: any) {
            setErrorMessage(error.message ?? 'No se pudieron cargar los temas.');
        } finally {
            setTopicsLoading(false);
        }
    }, [accessToken, roomId]);

    useEffect(() => {
        if (!visible) return;
        reset();
        loadTopics();
    }, [visible, reset, loadTopics]);

    const handleOptionChange = (index: number, value: string) => {
        setOptions(current => current.map((option, i) => (i === index ? value : option)));
    };

    const toggleTopic = (topicId: string) => {
        setSelectedTopicIds(current => {
            if (current.includes(topicId)) {
                return current.filter(id => id !== topicId);
            }

            if (current.length >= 5) {
                setErrorMessage('Podes seleccionar hasta 5 temas por pregunta.');
                return current;
            }

            setErrorMessage(null);
            return [...current, topicId];
        });
    };

    const handleCreateTopic = async () => {
        if (!accessToken || !roomId || creatingTopic) return;

        const name = newTopicName.trim();

        if (name.length < 2) {
            setErrorMessage('El tema debe tener al menos 2 caracteres.');
            return;
        }

        const existingTopic = topics.find(topic => normalizeTopicName(topic.name) === normalizeTopicName(name));
        if (existingTopic) {
            setSelectedTopicIds(current => current.includes(existingTopic.id) ? current : [...current, existingTopic.id].slice(0, 5));
            setNewTopicName('');
            setErrorMessage('Ese tema ya existe y fue seleccionado.');
            return;
        }

        setCreatingTopic(true);
        setErrorMessage(null);
        try {
            const topic = await createRoomTopic(accessToken, roomId, { name });
            setTopics(current => {
                const withoutDuplicate = current.filter(item => item.id !== topic.id);
                return [...withoutDuplicate, topic].sort((a, b) => a.name.localeCompare(b.name));
            });
            setSelectedTopicIds(current => current.includes(topic.id) ? current : [...current, topic.id].slice(0, 5));
            setNewTopicName('');
        } catch (error: any) {
            setErrorMessage(error.message ?? 'No se pudo crear el tema.');
        } finally {
            setCreatingTopic(false);
        }
    };

    const handleSubmit = async () => {
        if (!accessToken || !roomId) return;

        const trimmedQuestion = questionText.trim();

        if (!trimmedQuestion) {
            setErrorMessage('Escribi el enunciado de la pregunta.');
            return;
        }

        const payload: CreateQuestionInput = type === 'multiple_choice'
            ? {
                type,
                question_text: trimmedQuestion,
                topic_ids: selectedTopicIds,
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
                topic_ids: selectedTopicIds,
};

        setErrorMessage(null);
        setSaving(true);
        try {
            await createRoomQuestion(accessToken, roomId, payload);
            onCreated();
            reset();
            onClose();
        } catch (error: any) {
            setErrorMessage(error.message ?? 'Revisa los datos e intenta nuevamente.');
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

                        <View style={styles.topicSection}>
                            <Text style={styles.label}>Tema academico</Text>
                            {topicsLoading ? (
                                <ActivityIndicator color="#38bdf8" style={styles.topicLoader} />
                            ) : topics.length === 0 ? (
                                <Text style={styles.hint}>Sin temas creados. Podes crear uno o dejar la pregunta sin clasificar.</Text>
                            ) : (
                                <View style={styles.topicList}>
                                    {topics.map(topic => {
                                        const selected = selectedTopicIds.includes(topic.id);

                                        return (
                                            <Pressable
                                                key={topic.id}
                                                style={[styles.topicChip, selected && styles.topicChipActive]}
                                                onPress={() => toggleTopic(topic.id)}
                                            >
                                                <Text style={[styles.topicText, selected && styles.topicTextActive]}>
                                                    {topic.name}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}
                            <View style={styles.newTopicRow}>
                                <TextInput
                                    style={styles.newTopicInput}
                                    placeholder="Nuevo tema"
                                    placeholderTextColor="#4b5563"
                                    value={newTopicName}
                                    onChangeText={setNewTopicName}
                                />
                                <Pressable
                                    style={[styles.newTopicBtn, creatingTopic && styles.disabledBtn]}
                                    onPress={handleCreateTopic}
                                    disabled={creatingTopic}
                                >
                                    {creatingTopic ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Plus color="white" size={18} />
                                    )}
                                </Pressable>
                            </View>
                        </View>

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

                        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

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

function normalizeTopicName(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
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
    topicSection: { marginTop: 15 },
    topicLoader: { alignSelf: 'flex-start', marginBottom: 10 },
    topicList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    topicChip: { borderWidth: 1, borderColor: '#334155', backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
    topicChipActive: { borderColor: '#38bdf8', backgroundColor: '#0c4a6e' },
    topicText: { color: '#94a3b8', fontSize: 12, fontWeight: '800' },
    topicTextActive: { color: 'white' },
    newTopicRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    newTopicInput: { flex: 1, backgroundColor: '#0f172a', color: 'white', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
    newTopicBtn: { width: 44, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
    hint: { color: '#64748b', fontSize: 12, marginTop: 5, textAlign: 'center' },
    errorText: { color: '#fca5a5', fontSize: 13, fontWeight: '700', marginTop: 14, textAlign: 'center' },
    addBtn: { backgroundColor: '#22c55e', height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 25 },
    disabledBtn: { opacity: 0.7 },
    addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
