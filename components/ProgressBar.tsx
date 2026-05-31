interface ProgressBarProps {
  label: string;
  current: number;
  target: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const colorClasses = {
  blue: 'bg-blue-500 dark:bg-blue-600',
  green: 'bg-green-500 dark:bg-green-600',
  purple: 'bg-purple-500 dark:bg-purple-600',
  orange: 'bg-orange-500 dark:bg-orange-600',
};

export default function ProgressBar({ label, current, target, color }: ProgressBarProps) {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">₱{current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ₱{target.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{percentage.toFixed(0)}% complete</p>
    </div>
  );
}
