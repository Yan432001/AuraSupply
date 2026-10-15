import React from 'react';

/**
 * Standard Order States:
 * Pending -> Confirmed -> Preparing -> Delivered
 */
export const ORDER_STEPS = [
  {
    key: 'pending',
    label: 'Pending',
    sublabel: 'Order Placed',
    icon: '⏳',
    color: '#f59e0b',
    activeColor: 'bg-amber-500',
    borderActive: 'border-amber-500',
    ringActive: 'ring-amber-400/40',
    badgeText: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60',
    hint: 'Awaiting shop review',
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
    sublabel: 'Accepted by Shop',
    icon: '📋',
    color: '#3b82f6',
    activeColor: 'bg-blue-600',
    borderActive: 'border-blue-600',
    ringActive: 'ring-blue-400/40',
    badgeText: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/60',
    hint: 'Shop staff has accepted the order',
  },
  {
    key: 'preparing',
    label: 'Preparing',
    sublabel: 'Kitchen in Progress',
    icon: '🍳',
    color: '#8b5cf6',
    activeColor: 'bg-purple-600',
    borderActive: 'border-purple-600',
    ringActive: 'ring-purple-400/40',
    badgeText: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800/60',
    hint: 'Items are being prepared & packed',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    sublabel: 'Completed & Served',
    icon: '✅',
    color: '#10b981',
    activeColor: 'bg-emerald-600',
    borderActive: 'border-emerald-600',
    ringActive: 'ring-emerald-400/40',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60',
    hint: 'Order completed and delivered to table / customer',
  },
];

export function getOrderStepIndex(status = 'pending') {
  if (!status) return 0;
  const s = String(status).toLowerCase().trim();

  if (s === 'delivered' || s === 'completed' || s === 'fulfilled' || s === 'ready') {
    return 3;
  }
  if (s === 'preparing' || s === 'processing' || s === 'in_progress' || s === 'cooking' || s === 'kitchen') {
    return 2;
  }
  if (s === 'confirmed' || s === 'accepted' || s === 'approved') {
    return 1;
  }
  return 0; // Default to Pending
}

/**
 * OrderStatusStepper
 * Visual progress stepper representing:
 * Pending -> Confirmed -> Preparing -> Delivered
 */
export default function OrderStatusStepper({
  status = 'pending',
  orderId = '',
  compact = false,
  className = '',
}) {
  const activeStatus = status;
  const currentStepIndex = getOrderStepIndex(activeStatus);
  const currentStep = ORDER_STEPS[currentStepIndex];

  // Calculate percentage width for progress line
  const progressPercent = (currentStepIndex / (ORDER_STEPS.length - 1)) * 100;

  return (
    <div
      className={`rounded-2xl p-3.5 sm:p-4 bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 transition-all ${className}`}
    >
      {/* Top Header: Current State Badge & Description */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-ping bg-blue-500" />
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Order Progress
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentStep.badgeBg} ${currentStep.badgeText}`}
          >
            <span>{currentStep.icon}</span>
            <span>{currentStep.label}</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono font-medium">
            Step {currentStepIndex + 1}/4
          </span>
        </div>
      </div>

      {/* Progress Stepper Visual Bar */}
      <div className="relative pt-2 pb-1 px-2">
        {/* Background Connecting Line */}
        <div className="absolute top-[22px] left-6 right-6 h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0 rounded-full overflow-hidden">
          {/* Animated Active Line Fill */}
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-blue-500 via-purple-500 to-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stepper Nodes */}
        <div className="relative z-10 flex items-start justify-between">
          {ORDER_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isUpcoming = idx > currentStepIndex;

            return (
              <div
                key={step.key}
                onClick={showSimulateControls ? () => handleStepClick(step.key) : undefined}
                className={`flex flex-col items-center flex-1 transition-all select-none ${
                  showSimulateControls ? 'cursor-pointer group' : ''
                }`}
              >
                {/* Node Circle */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-300 dark:ring-emerald-900'
                      : isCurrent
                      ? `${step.activeColor} text-white shadow-md ring-4 ${step.ringActive} scale-110 animate-pulse`
                      : 'bg-white dark:bg-slate-800 text-slate-400 border-2 border-slate-300 dark:border-slate-700'
                  }`}
                  title={`${step.label}: ${step.hint}`}
                >
                  {isCompleted ? '✓' : step.icon}
                </div>

                {/* Step Label */}
                <div className="text-center mt-1.5 px-0.5">
                  <div
                    className={`text-[11px] sm:text-xs font-bold transition-colors leading-tight ${
                      isCurrent
                        ? 'text-slate-900 dark:text-white font-extrabold'
                        : isCompleted
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {step.label}
                  </div>
                  {!compact && (
                    <div
                      className={`text-[9px] sm:text-[10px] hidden xs:block transition-colors leading-tight mt-0.5 ${
                        isCurrent
                          ? 'text-slate-600 dark:text-slate-300 font-medium'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {step.sublabel}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Hint Note */}
      <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="text-slate-400">Status Details:</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {currentStep.hint}
          </span>
        </span>
      </div>
    </div>
  );
}
