'use client';

import React from 'react';
import { AlertCircleIcon, RefreshIcon } from './Icons';

interface LoadErrorProps {
  mensaje: string;
  onRetry: () => void;
}

export const LoadError: React.FC<LoadErrorProps> = ({ mensaje, onRetry }) => {
  return (
    <div className="bg-white rounded-xl border border-red-200 p-8 text-center space-y-4">
      <AlertCircleIcon className="w-10 h-10 text-red-500 mx-auto" />
      <div>
        <h3 className="text-sm font-bold text-red-700">
          No se pudieron cargar los datos
        </h3>
        <p className="text-sm text-gray-600 mt-1">{mensaje}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#27153D] text-white text-xs font-bold hover:bg-[#3E828E] transition-colors"
      >
        <RefreshIcon className="w-4 h-4" />
        <span>Reintentar</span>
      </button>
    </div>
  );
};
