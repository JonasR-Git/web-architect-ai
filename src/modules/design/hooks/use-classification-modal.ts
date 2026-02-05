import { useState, useCallback } from 'react';
import type { ImageForClassification, ClassificationResult } from '@/modules/design/services/ai-image-classifier';

export interface ClassificationModalState {
  isOpen: boolean;
  imageCount: number;
  tokenEstimate: number;
  estimatedCost: number;
  images: ImageForClassification[];
  onComplete?: (classifications: ClassificationResult[]) => void;
}

export interface ClassificationModalControls {
  modalState: ClassificationModalState;
  isClassifying: boolean;
  setIsClassifying: (classifying: boolean) => void;
  openModal: (config: {
    images: ImageForClassification[];
    onComplete: (classifications: ClassificationResult[]) => void;
  }) => void;
  closeModal: () => void;
  handleApprove: (classifications: ClassificationResult[]) => void;
  handleSkip: () => void;
}

/**
 * Hook for managing AI image classification modal state
 * Centralizes modal logic that was previously inline in page.tsx
 */
export function useClassificationModal(): ClassificationModalControls {
  const [modalState, setModalState] = useState<ClassificationModalState>({
    isOpen: false,
    imageCount: 0,
    tokenEstimate: 0,
    estimatedCost: 0,
    images: []
  });
  const [isClassifying, setIsClassifying] = useState(false);

  const openModal = useCallback((config: {
    images: ImageForClassification[];
    onComplete: (classifications: ClassificationResult[]) => void;
  }) => {
    setModalState({
      isOpen: true,
      imageCount: config.images.length,
      tokenEstimate: config.images.length * 500,
      estimatedCost: (config.images.length * 500 * 0.00001),
      images: config.images,
      onComplete: config.onComplete
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const handleApprove = useCallback((classifications: ClassificationResult[]) => {
    if (modalState.onComplete) {
      modalState.onComplete(classifications);
    }
    closeModal();
  }, [modalState.onComplete, closeModal]);

  const handleSkip = useCallback(() => {
    closeModal();
  }, [closeModal]);

  return {
    modalState,
    isClassifying,
    setIsClassifying,
    openModal,
    closeModal,
    handleApprove,
    handleSkip,
  };
}
