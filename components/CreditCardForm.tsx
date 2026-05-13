'use client';

import { useState } from 'react';
import { CreditCard } from '@/types';
import { createCreditCard } from '@/lib/creditCardHelpers';

interface CreditCardFormProps {
  onSubmit: (card: CreditCard) => void;
  initialCard?: CreditCard;
  onCancel?: () => void;
}

export default function CreditCardForm({ onSubmit, initialCard, onCancel }: CreditCardFormProps) {
  const [name, setName] = useState(initialCard?.name || '');
  const [creditLimit, setCreditLimit] = useState(initialCard?.creditLimit.toString() || '');
  const [currentBalance, setCurrentBalance] = useState(initialCard?.currentBalance.toString() || '0');
  const [notes, setNotes] = useState(initialCard?.notes || '');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || !creditLimit) {
      alert('Please fill in card name and credit limit');
      return;
    }

    const card: CreditCard = {
      id: initialCard?.id || Date.now().toString(),
      name,
      creditLimit: parseFloat(creditLimit),
      currentBalance: parseFloat(currentBalance) || 0,
      notes,
      createdAt: initialCard?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSubmit(card);

    if (!initialCard) {
      setName('');
      setCreditLimit('');
      setCurrentBalance('0');
      setNotes('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Card Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., BDO Visa, GCash Card"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Credit Limit (₱)</label>
          <input
            type="number"
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
            placeholder="0.00"
            step="100"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Current Balance (₱)</label>
          <input
            type="number"
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Negative balance = overpayment/credit surplus</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 transition"
        >
          {initialCard ? 'Update' : 'Add'} Card
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
