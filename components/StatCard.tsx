interface StatCardProps {
  title: string;
  amount: number;
  icon: string;
  bgColor: string;
  textColor: string;
}

export default function StatCard({ title, amount, icon, bgColor, textColor }: StatCardProps) {
  return (
    <div className={`${bgColor} rounded-2xl p-6 border transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="label-md text-gray-600 dark:text-gray-400 uppercase">{title}</p>
          <p className={`${textColor} text-value-md mt-3 tracking-tight`}>
            ₱<span className="font-black">{amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </p>
        </div>
        <span className="text-5xl opacity-75 ml-4 flex-shrink-0">{icon}</span>
      </div>
    </div>
  );
}
