import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';

// ─── Types ───────────────────────────────────────────────────────────────────

export type QuestionType = 'text' | 'multiple_choice' | 'boolean';

export interface Question {
  id: string;
  question: string;
  questionType: QuestionType;
  options: string[] | null;
  required: boolean;
  order: number;
  /** Raw answer that may come from the server – boolean or string */
  answer: string | boolean | null;
}

interface VerificationQuestionsProps {
  questions: Question[];
  onAnswersChange?: (answers: Record<string, string>) => void;
  readonly?: boolean;
  initialAnswers?: Record<string, string>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalise a raw server answer (string | boolean | null) → string.
 * Booleans become "Yes" / "No" so the rest of the component only deals with strings.
 */
const normaliseAnswer = (raw: string | boolean | null): string => {
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';
  return raw;
};

const isAnswered = (value: string | undefined): boolean =>
  !!value && value.trim().length > 0;

// ─── Sub-components ──────────────────────────────────────────────────────────

interface QuestionBadgeProps {
  index: number;
  answered: boolean;
}

const QuestionBadge: React.FC<QuestionBadgeProps> = ({ index, answered }) => (
  <View
    className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
      answered ? 'bg-green-100' : 'bg-blue-100'
    }`}
  >
    {answered ? (
      <Feather name="check" size={14} color="#10B981" />
    ) : (
      <Text className="font-rubik-bold text-sm text-blue-700">{index + 1}</Text>
    )}
  </View>
);

interface TextAnswerProps {
  value: string;
  onChange: (v: string) => void;
  readonly: boolean;
}

const TextAnswer: React.FC<TextAnswerProps> = ({ value, onChange, readonly }) => (
  <TextInput
    className={`rounded-xl p-4 border font-rubik text-gray-800 min-h-[80px] ${
      readonly ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-gray-50 border-gray-200'
    }`}
    placeholder="Type your answer here…"
    placeholderTextColor="#9CA3AF"
    value={value}
    onChangeText={onChange}
    editable={!readonly}
    multiline
    textAlignVertical="top"
    scrollEnabled={false}
  />
);

interface ChoiceAnswerProps {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  readonly: boolean;
}

const ChoiceAnswer: React.FC<ChoiceAnswerProps> = ({
  options,
  selected,
  onSelect,
  readonly,
}) => (
  <View className="gap-2">
    {options.map((option) => {
      const isSelected = selected === option;
      return (
        <TouchableOpacity
          key={option}
          className={`flex-row items-center p-4 rounded-xl border ${
            isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-gray-50'
          }`}
          onPress={() => !readonly && onSelect(option)}
          disabled={readonly}
          activeOpacity={0.7}
        >
          <View
            className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
              isSelected ? 'border-primary-500' : 'border-gray-300'
            }`}
          >
            {isSelected && (
              <View className="w-2.5 h-2.5 rounded-full bg-primary-500" />
            )}
          </View>
          <Text
            className={`font-rubik flex-1 ${
              isSelected ? 'text-primary-700 font-rubik-medium' : 'text-gray-700'
            } ${readonly ? 'opacity-60' : ''}`}
          >
            {option}
          </Text>
          {isSelected && (
            <Feather name="check-circle" size={16} color="#7C3AED" />
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

interface BooleanAnswerProps {
  selected: string;
  onSelect: (v: string) => void;
  readonly: boolean;
}

const BooleanAnswer: React.FC<BooleanAnswerProps> = ({
  selected,
  onSelect,
  readonly,
}) => {
  const options: Array<{ label: string; icon: string; yesColor: string }> = [
    { label: 'Yes', icon: 'check', yesColor: 'yes' },
    { label: 'No', icon: 'x', yesColor: 'no' },
  ];

  return (
    <View className="flex-row gap-3">
      {options.map(({ label, icon }) => {
        const isSelected = selected === label;
        const isYes = label === 'Yes';
        return (
          <TouchableOpacity
            key={label}
            className={`flex-1 flex-row items-center justify-center gap-2 p-4 rounded-xl border ${
              isSelected
                ? isYes
                  ? 'border-green-400 bg-green-50'
                  : 'border-red-400 bg-red-50'
                : 'border-gray-200 bg-gray-50'
            } ${readonly ? 'opacity-60' : ''}`}
            onPress={() => !readonly && onSelect(label)}
            disabled={readonly}
            activeOpacity={0.7}
          >
            <View
              className={`w-6 h-6 rounded-full items-center justify-center ${
                isSelected
                  ? isYes
                    ? 'bg-green-500'
                    : 'bg-red-500'
                  : 'bg-gray-200'
              }`}
            >
              <Feather
                name={icon as any}
                size={12}
                color={isSelected ? '#fff' : '#9CA3AF'}
              />
            </View>
            <Text
              className={`font-rubik-medium ${
                isSelected
                  ? isYes
                    ? 'text-green-700'
                    : 'text-red-700'
                  : 'text-gray-500'
              }`}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

interface ReadonlyAnswerProps {
  question: Question;
  answer: string;
}

const ReadonlyAnswer: React.FC<ReadonlyAnswerProps> = ({ question, answer }) => {
  if (!isAnswered(answer)) {
    return (
      <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <Text className="font-rubik text-gray-400 italic">No answer provided</Text>
      </View>
    );
  }

  return (
    <View className="bg-gray-50 rounded-xl p-4 border border-gray-200 gap-2">
      <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide">Answer</Text>
      {question.questionType === 'boolean' ? (
        <View
          className={`self-start flex-row items-center gap-2 px-3 py-2 rounded-lg ${
            answer === 'Yes' ? 'bg-green-100' : 'bg-red-100'
          }`}
        >
          <Feather
            name={answer === 'Yes' ? 'check-circle' : 'x-circle'}
            size={14}
            color={answer === 'Yes' ? '#10B981' : '#EF4444'}
          />
          <Text
            className={`font-rubik-medium text-sm ${
              answer === 'Yes' ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {answer}
          </Text>
        </View>
      ) : (
        <Text className="font-rubik text-gray-800 leading-relaxed">{answer}</Text>
      )}
    </View>
  );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  answered: number;
  total: number;
  required: number;
  requiredAnswered: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  answered,
  total,
  required,
  requiredAnswered,
}) => {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  const allRequiredDone = required === 0 || requiredAnswered === required;

  return (
    <View className="px-5 py-3 border-b border-gray-100 bg-white">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-rubik text-xs text-gray-500">
          {answered} of {total} answered
        </Text>
        {required > 0 && (
          <View
            className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${
              allRequiredDone ? 'bg-green-100' : 'bg-amber-100'
            }`}
          >
            <Feather
              name={allRequiredDone ? 'check' : 'alert-circle'}
              size={10}
              color={allRequiredDone ? '#10B981' : '#F59E0B'}
            />
            <Text
              className={`font-rubik text-xs ${
                allRequiredDone ? 'text-green-700' : 'text-amber-700'
              }`}
            >
              {requiredAnswered}/{required} required
            </Text>
          </View>
        )}
      </View>
      <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <View
          className="h-full bg-primary-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const VerificationQuestions: React.FC<VerificationQuestionsProps> = ({
  questions,
  onAnswersChange,
  readonly = false,
  initialAnswers = {},
}) => {
  const { colors } = useTheme();

  // All answers normalised to strings
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Initialise answers once – server values + prop overrides
  useEffect(() => {
    const fromServer: Record<string, string> = {};
    questions.forEach((q) => {
      fromServer[q.id] = normaliseAnswer(q.answer);
    });
    const merged: Record<string, string> = { ...fromServer, ...initialAnswers };
    setAnswers(merged);

    // Start with all sections expanded
    setExpandedIds(new Set(questions.map((q) => q.id)));
  }, [questions]);

  const handleAnswerChange = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => {
        const next = { ...prev, [questionId]: value };
        onAnswersChange?.(next);
        return next;
      });
    },
    [onAnswersChange],
  );

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Derived stats
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
  const answeredCount = sortedQuestions.filter((q) => isAnswered(answers[q.id])).length;
  const requiredQuestions = sortedQuestions.filter((q) => q.required);
  const requiredAnsweredCount = requiredQuestions.filter((q) =>
    isAnswered(answers[q.id]),
  ).length;

  if (questions.length === 0) {
    return (
      <View className="bg-white rounded-2xl p-8 items-center justify-center border border-gray-100">
        <View className="w-16 h-16 rounded-2xl bg-gray-100 items-center justify-center mb-3">
          <Feather name="clipboard" size={28} color="#9CA3AF" />
        </View>
        <Text className="font-rubik-medium text-gray-400 text-center">
          No questions to display
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View className="p-5 bg-gray-50/50 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="font-rubik-bold text-lg text-gray-900">
              Verification Questions
            </Text>
            <Text className="font-rubik text-sm text-gray-500 mt-0.5">
              {readonly
                ? 'Review the submitted responses'
                : 'Answer all required questions to submit'}
            </Text>
          </View>
          <View className="bg-blue-100 px-3 py-1.5 rounded-full">
            <Text className="font-rubik-medium text-sm text-blue-700">
              {questions.length} Q{questions.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Progress ────────────────────────────────────────────────────── */}
      {!readonly && (
        <ProgressBar
          answered={answeredCount}
          total={sortedQuestions.length}
          required={requiredQuestions.length}
          requiredAnswered={requiredAnsweredCount}
        />
      )}

      {/* ── Questions ───────────────────────────────────────────────────── */}
      {sortedQuestions.map((question, index) => {
        const isExpanded = expandedIds.has(question.id);
        const answered = isAnswered(answers[question.id]);
        const currentAnswer = answers[question.id] ?? '';
        const isLast = index === sortedQuestions.length - 1;

        return (
          <View
            key={question.id}
            className={!isLast ? 'border-b border-gray-100' : ''}
          >
            {/* Question header row */}
            <TouchableOpacity
              onPress={() => toggleExpanded(question.id)}
              className="flex-row items-center p-4"
              activeOpacity={0.7}
            >
              <QuestionBadge index={index} answered={answered} />

              <View className="flex-1">
                <View className="flex-row flex-wrap items-start">
                  <Text className="font-rubik-medium text-gray-800 text-sm flex-shrink">
                    {question.question}
                  </Text>
                  {question.required && (
                    <Text className="font-rubik-bold text-red-400 ml-1 text-sm">*</Text>
                  )}
                </View>

                {/* Status pill */}
                <View className="flex-row items-center mt-1 gap-2">
                  <View
                    className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full self-start ${
                      answered ? 'bg-green-100' : question.required ? 'bg-red-50' : 'bg-gray-100'
                    }`}
                  >
                    <Feather
                      name={answered ? 'check-circle' : question.required ? 'alert-circle' : 'circle'}
                      size={10}
                      color={answered ? '#10B981' : question.required ? '#EF4444' : '#9CA3AF'}
                    />
                    <Text
                      className={`font-rubik text-xs ${
                        answered
                          ? 'text-green-700'
                          : question.required
                          ? 'text-red-500'
                          : 'text-gray-400'
                      }`}
                    >
                      {answered ? 'Answered' : question.required ? 'Required' : 'Optional'}
                    </Text>
                  </View>

                  {/* Type badge */}
                  <View className="bg-gray-100 px-2 py-0.5 rounded-full self-start">
                    <Text className="font-rubik text-xs text-gray-400 capitalize">
                      {question.questionType.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </View>

              <Feather
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#9CA3AF"
              />
            </TouchableOpacity>

            {/* Expanded answer area */}
            {isExpanded && (
              <View className="px-4 pb-4">
                {readonly ? (
                  <ReadonlyAnswer question={question} answer={currentAnswer} />
                ) : (
                  <View className="gap-2">
                    {question.questionType === 'text' && (
                      <TextAnswer
                        value={currentAnswer}
                        onChange={(v) => handleAnswerChange(question.id, v)}
                        readonly={false}
                      />
                    )}

                    {question.questionType === 'multiple_choice' &&
                      question.options != null &&
                      question.options.length > 0 && (
                        <ChoiceAnswer
                          options={question.options}
                          selected={currentAnswer}
                          onSelect={(v) => handleAnswerChange(question.id, v)}
                          readonly={false}
                        />
                      )}

                    {question.questionType === 'boolean' && (
                      <BooleanAnswer
                        selected={currentAnswer}
                        onSelect={(v) => handleAnswerChange(question.id, v)}
                        readonly={false}
                      />
                    )}

                    {/* Unanswered required hint */}
                    {question.required && !answered && (
                      <View className="flex-row items-center gap-1.5 mt-1">
                        <Feather name="alert-circle" size={12} color="#F59E0B" />
                        <Text className="font-rubik text-xs text-amber-600">
                          This question requires an answer before submitting
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

export default VerificationQuestions;