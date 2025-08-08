import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FocusLock from 'react-focus-lock';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  BookOpen,
  Zap,
  Shield,
  Clock,
  Users,
  Search,
  FileText,
  Eye
} from 'lucide-react';

interface GuideStep {
  id: string;
  title: string;
  description: string;
  painPoint: string;
  solution: string;
  ctaText?: string;
  ctaAction?: () => void;
  icon: React.ComponentType<{ className?: string }>;
}

interface OnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const guideSteps: GuideStep[] = [
  {
    id: 'version-safety',
    title: 'Version-Safe Publishing',
    description: 'Never lose custom references again',
    painPoint: 'In Salesforce, republishing articles can break links to custom objects and cause data loss.',
    solution: 'Kublish preserves all references automatically during publishing. Your custom links, attachments, and object relationships stay intact across all versions.',
    ctaText: 'View Version History',
    icon: Shield
  },
  {
    id: 'bulk-operations',
    title: 'Smart Bulk Operations',
    description: 'Update multiple articles safely',
    painPoint: 'Bulk editing in Salesforce often wipes custom fields and breaks references without warning.',
    solution: 'Kublish warns you before bulk changes break anything and provides safe batch operations with rollback capabilities.',
    ctaText: 'Try Bulk Editor',
    icon: Users
  },
  {
    id: 'advanced-search',
    title: 'Advanced Search & Filtering',
    description: 'Find articles across multiple states',
    painPoint: 'Salesforce limits search to one status at a time, making it hard to find related content.',
    solution: 'Search across Draft + Published articles simultaneously, or create custom filters that match your workflow needs.',
    ctaText: 'Explore Search',
    icon: Search
  },
  {
    id: 'rich-history',
    title: 'Rich Version History',
    description: 'Complete visibility into changes',
    painPoint: 'Salesforce provides minimal version tracking with no diff views or easy rollback options.',
    solution: 'See exactly what changed, who changed it, and restore any previous version with one click. Full audit trail included.',
    ctaText: 'See Version Timeline',
    icon: Clock
  },
  {
    id: 'case-tracking',
    title: 'Case-Article Link Tracking',
    description: 'Know which articles solve which cases',
    painPoint: 'Poor reporting on which articles are attached to which cases makes it hard to measure article effectiveness.',
    solution: 'Kublish tracks every case-article connection with full reporting and analytics on article usage and success rates.',
    ctaText: 'View Link Reports',
    icon: FileText
  },
  {
    id: 'dynamic-visibility',
    title: 'Smart Content Visibility',
    description: 'Dynamic layouts that actually work',
    painPoint: 'Dynamic layout visibility conditions in Salesforce are unreliable and require complex formula fields.',
    solution: 'Use simple metadata tags like "Technical" or "Has JIRA Link" to control visibility with reliable, clean logic.',
    ctaText: 'Configure Visibility',
    icon: Eye
  }
];

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentGuideStep = guideSteps[currentStep];
  const isLastStep = currentStep === guideSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    
    if (isLastStep) {
      onComplete();
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleCTA = () => {
    if (currentGuideStep.ctaAction) {
      currentGuideStep.ctaAction();
    }
    // Mark step as completed and continue
    handleNext();
  };

  const handleSkip = () => {
    onComplete();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity z-40"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-50"
          >
            <FocusLock>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Welcome to Kublish</h3>
                      <p className="text-sm text-gray-600">Discover how we solve Salesforce Knowledge pain points</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="px-6 py-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Step {currentStep + 1} of {guideSteps.length}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(((currentStep + 1) / guideSteps.length) * 100)}% complete
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / guideSteps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step Navigation */}
              <div className="px-6 py-3 border-b border-gray-200">
                <div className="flex items-center space-x-2 overflow-x-auto">
                  {guideSteps.map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => handleStepClick(index)}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                        index === currentStep
                          ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border border-purple-200'
                          : completedSteps.has(index)
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {completedSteps.has(index) ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <step.icon className="w-3 h-3" />
                      )}
                      <span>{step.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <currentGuideStep.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      {currentGuideStep.title}
                    </h4>
                    <p className="text-gray-600 mb-4">
                      {currentGuideStep.description}
                    </p>
                  </div>
                </div>

                {/* Pain Point */}
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h5 className="text-sm font-semibold text-red-800 mb-2">The Salesforce Problem:</h5>
                  <p className="text-sm text-red-700">{currentGuideStep.painPoint}</p>
                </div>

                {/* Solution */}
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <h5 className="text-sm font-semibold text-emerald-800 mb-2">How Kublish Solves It:</h5>
                  <p className="text-sm text-emerald-700">{currentGuideStep.solution}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {!isFirstStep && (
                      <button
                        onClick={handlePrevious}
                        className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>
                    )}
                    
                    <button
                      onClick={handleSkip}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Skip tour
                    </button>
                  </div>

                  <div className="flex items-center space-x-3">
                    {currentGuideStep.ctaText && (
                      <button
                        onClick={handleCTA}
                        className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                      >
                        <span>{currentGuideStep.ctaText}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={handleNext}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                    >
                      <span>{isLastStep ? 'Complete Tour' : 'Next'}</span>
                      {!isLastStep && <ArrowRight className="w-4 h-4" />}
                      {isLastStep && <CheckCircle className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </FocusLock>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default OnboardingGuide;