'use client';

import { QuestionDoc, QuestionTypeEnum } from '@paperwork/types';
import { QuestionMap } from './types';
import { generateObjectId } from '../utils';
import { useCallback, useState } from 'react';

/**
 * @description: it is designed only for a single form, so it will not be used in multiple forms at the same time
 * @returns {Object} - An object containing the questions map and functions to manage it
 */

export default function useQuestionManager() {
    const [questionsMap, setQuestionsMap] = useState<QuestionMap>(new Map());

    const initializeQuestionsMap = useCallback((questions: QuestionDoc[]) => {
        setQuestionsMap(
            new Map(questions.map((question) => [question.id, question]))
        );
    }, []);

    function addQuestion(sectionId: string) {
        // Defensive: callers must pass a raw section id, but a compound DOM
        // id (`section-<id>:question-<id>`) slipped through here before and
        // produced questions in a void section. Normalize regardless.
        const cleanSectionId = sectionId.includes(':')
            ? (sectionId.split(':')[0]?.replace(/^section-/, '') ?? sectionId)
            : sectionId.replace(/^section-/, '');
        const newMap = new Map(questionsMap);
        const maxIndex = [...newMap.values()]
            .filter((q) => q.sectionId === cleanSectionId)
            .reduce((m, q) => Math.max(m, q.index ?? -1), -1);
        const question: QuestionDoc = {
            id: generateObjectId(),
            sectionId: cleanSectionId,
            index: maxIndex + 1,
            question: '',
            slug: `q-${Date.now().toString(36)}`,
            type: QuestionTypeEnum.TEXT,
            v: 0,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            formId: '',
        };
        newMap.set(question.id, question);
        setQuestionsMap(newMap);
    }

    function deleteQuestion(questionId: string) {
        const newMap = new Map(questionsMap);
        newMap.delete(questionId);
        setQuestionsMap(newMap);
    }

    function updateQuestion(
        questionId: string,
        updater: (prev: QuestionDoc) => QuestionDoc
    ) {
        setQuestionsMap((prevMap) => {
            const question = prevMap.get(questionId);
            if (!question) return prevMap;

            const newMap = new Map(prevMap);
            newMap.set(questionId, updater(question));

            return newMap;
        });
    }

    function getAllQuestions(sectionOrder: string[]) {
        const sectionPositionMap = new Map(
            sectionOrder.map((sectionId, index) => [sectionId, index])
        );
        return Array.from(questionsMap.values()).sort((a, b) => {
            const posA = sectionPositionMap.get(a.sectionId) ?? 0;
            const posB = sectionPositionMap.get(b.sectionId) ?? 0;
            if (posA !== posB) {
                return posA - posB;
            }
            return a.index - b.index;
        });
    }

    function getQuestionById(questionId: string) {
        return questionsMap.get(questionId);
    }

    function getQuestionsBySectionId(sectionId: string) {
        return Array.from(questionsMap.values())
            .filter((question) => question.sectionId === sectionId)
            .sort((a, b) => a.index - b.index);
    }

    function duplicateQuestion(questionId: string) {
        const newMap = new Map(questionsMap);
        const questionToDuplicate = newMap.get(questionId);
        if (!questionToDuplicate) return;
        const maxIndex = [...newMap.values()]
            .filter((q) => q.sectionId === questionToDuplicate.sectionId)
            .reduce((m, q) => Math.max(m, q.index ?? -1), -1);
        const duplicatedQuestion: QuestionDoc = {
            ...questionToDuplicate,
            id: generateObjectId(),
            index: maxIndex + 1,
        };
        newMap.set(duplicatedQuestion.id, duplicatedQuestion);
        setQuestionsMap(newMap);
    }

    function updateDuplicateQuestionWithServerID(
        questionId: string,
        serverId: string
    ) {
        const newMap = new Map(questionsMap);
        const questionToUpdate = newMap.get(questionId);
        if (questionToUpdate) {
            const updatedQuestion: QuestionDoc = {
                ...questionToUpdate,
                id: serverId,
            };
            newMap.delete(questionId);
            newMap.set(serverId, updatedQuestion);
            setQuestionsMap(newMap);
        }
    }
    function reorderQuestions(
        newSectionQuestions: QuestionDoc[],
        targetSectionId: string
    ) {
        const newMap = new Map(questionsMap);

        newSectionQuestions.forEach((question, index) => {
            const updatedQuestion: QuestionDoc = {
                ...question,
                sectionId: targetSectionId,
                index,
            };
            newMap.set(updatedQuestion.id, updatedQuestion);
        });

        setQuestionsMap(newMap);
    }
    return {
        questionsMap,
        setQuestionsMap,
        addQuestion,
        deleteQuestion,
        initializeQuestionsMap,
        updateQuestion,
        getAllQuestions,
        getQuestionById,
        getQuestionsBySectionId,
        duplicateQuestion,
        updateDuplicateQuestionWithServerID,
        reorderQuestions,
    };
}

export type QuestionManager = ReturnType<typeof useQuestionManager>;
