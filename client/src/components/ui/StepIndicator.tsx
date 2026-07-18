import React from 'react';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full py-4 px-2">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {steps.map((label, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <React.Fragment key={label}>
              {/* Step circle */}
              <div className="flex flex-col items-center relative">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 border-2
                    ${
                      isCompleted
                        ? 'bg-forest border-forest text-stone-100'
                        : isActive
                        ? 'bg-paper border-forest text-forest ring-4 ring-forest/10'
                        : 'bg-paper border-stone-300 text-stone-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`absolute -bottom-6 text-[10px] sm:text-xs font-medium whitespace-nowrap tracking-wide
                    ${isActive ? 'text-forest font-semibold' : 'text-stone-500'}
                  `}
                >
                  {label}
                </span>
              </div>

              {/* Line connector */}
              {idx < steps.length - 1 && (
                <div className="flex-1 mx-2 h-[2px] relative -top-3">
                  <div
                    className={`h-full transition-all duration-500
                      ${isCompleted ? 'bg-forest' : 'bg-stone-300'}
                    `}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="h-6" /> {/* spacer for the absolute positioned labels */}
    </div>
  );
}
