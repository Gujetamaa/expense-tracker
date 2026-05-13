interface StatCardProps {
  title: string;
  amount: number;
  icon: string;
  bgColor: string;
  textColor: string;
}

export default function StatCard({ title, amount, icon, bgColor, textColor }: StatCardProps) {
  return (
    <div className={`${bgColor} rounded-lg p-6 shadow-md border`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-semibold">{title}</p>
          <p className={`${textColor} text-2xl font-bold mt-2`}>
            ₱{amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}
