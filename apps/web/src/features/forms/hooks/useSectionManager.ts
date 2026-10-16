'use client';

import { useCallback, useState } from 'react';
import { SectionMap, SectionOrder } from './types';
import { SectionDoc } from '@paperwork/types';
import { generateObjectId } from '../utils';

/**
 * @description: it is  designed only for a single form, so it will not be used in multiple forms at the same time
 * @returns {Object} - An object containing the sections map and functions to manage it
 */

export default function useSectionManager() {
    const [sectionsMap, setSectionsMap] = useState<SectionMap>(new Map());
    const [sectionOrder, setSectionOrder] = useState<SectionOrder>([]);

    const initializeSectionsMap = useCallback((sections: SectionDoc[]) => {
        const sortedSections = [...sections].sort((a, b) => a.index - b.index);

        const newOrder: string[] = [];
        const newMap: SectionMap = new Map();

        for (const section of sortedSections) {
            newOrder.push(section.id);
            newMap.set(section.id, section);
        }

        setSectionOrder(newOrder);
        setSectionsMap(newMap);
    }, []);

    function addSection() {
        const maxIndex = [...sectionsMap.values()].reduce(
            (m, s) => Math.max(m, s.index ?? -1),
            -1
        );
        const newSection: SectionDoc = {
            id: generateObjectId(),
            index: maxIndex + 1,
            title: '',
            v: 0,
            updatedAt: '',
            createdAt: '',
            formId: '',
        };
        const newMap = new Map(sectionsMap);
        newMap.set(newSection.id, newSection);
        const newOrder = [...sectionOrder, newSection.id];
        setSectionOrder(newOrder);
        setSectionsMap(newMap);
    }

    function deleteSection(sectionId: string) {
        const newMap = new Map(sectionsMap);
        newMap.delete(sectionId);
        const newOrder = sectionOrder.filter((id) => id !== sectionId);
        setSectionOrder(newOrder);
        setSectionsMap(newMap);
    }

    function updateSection(
        sectionId: string,
        updater: (prev: SectionDoc) => SectionDoc
    ) {
        setSectionsMap((prevMap) => {
            const section = prevMap.get(sectionId);

            if (!section) return prevMap;

            const newMap = new Map(prevMap);
            newMap.set(sectionId, updater(section));

            return newMap;
        });
    }

    function getAllSections() {
        return Array.from(sectionsMap.values());
    }

    function getSectionById(sectionId: string) {
        return sectionsMap.get(sectionId);
    }

    function getSectionIndex(sectionId: string) {
        return sectionOrder.indexOf(sectionId);
    }

    function duplicateSection(sectionId: string) {
        const sectionToDuplicate = sectionsMap.get(sectionId);
        if (!sectionToDuplicate) return;
        const maxIndex = [...sectionsMap.values()].reduce(
            (m, s) => Math.max(m, s.index ?? -1),
            -1
        );
        const duplicatedSection: SectionDoc = {
            ...sectionToDuplicate,
            id: generateObjectId(),
            index: maxIndex + 1,
            title: `${sectionToDuplicate.title} (Copy)`,
        };

        const newMap = new Map(sectionsMap);
        newMap.set(duplicatedSection.id, duplicatedSection);
        setSectionsMap(newMap);

        const index = sectionOrder.indexOf(sectionId);
        const newOrder = [...sectionOrder];
        newOrder.splice(index + 1, 0, duplicatedSection.id);
        setSectionOrder(newOrder);
    }

    function updateDuplicateSectionWithServerId(
        duplicateSectionId: string,
        serverSectionId: string
    ) {
        const newMap = new Map(sectionsMap);
        const duplicateSection = newMap.get(duplicateSectionId);
        if (duplicateSection) {
            const updatedSection: SectionDoc = {
                ...duplicateSection,
                id: serverSectionId,
            };
            newMap.delete(duplicateSectionId);
            newMap.set(serverSectionId, updatedSection);
            setSectionsMap(newMap);

            setSectionOrder((prev) =>
                prev.map((id) =>
                    id === duplicateSectionId ? serverSectionId : id
                )
            );
        }
    }

    function reorderSections(newOrder: string[]) {
        // Preserve any sections missing from newOrder instead of dropping them.
        const newMap = new Map<string, SectionDoc>(sectionsMap);

        newOrder.forEach((sectionId, index) => {
            const section = newMap.get(sectionId);
            if (section) {
                newMap.set(sectionId, { ...section, index });
            }
        });

        setSectionOrder(newOrder.filter((id) => newMap.has(id)));
        setSectionsMap(newMap);
    }

    return {
        sectionsMap,
        initializeSectionsMap,
        addSection,
        deleteSection,
        updateSection,
        getAllSections,
        getSectionById,
        duplicateSection,
        updateDuplicateSectionWithServerId,
        sectionOrder,
        reorderSections,
        getSectionIndex,
    };
}

export type SectionManager = ReturnType<typeof useSectionManager>;
