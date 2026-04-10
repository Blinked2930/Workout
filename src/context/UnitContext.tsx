// src/context/UnitContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

type Unit = 'lbs' | 'kg';

interface UnitContextType {
  unit: Unit;
  toggleUnit: () => void;
  displayWeight: (dbWeightLbs: number) => string;
  toDisplay: (dbWeightLbs: number) => number | string;
  toDB: (displayWeight: number) => number;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export const UnitProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [unit, setUnit] = useState<Unit>(() => (localStorage.getItem('liftlog_unit') as Unit) || 'lbs');

  useEffect(() => {
    localStorage.setItem('liftlog_unit', unit);
  }, [unit]);

  const toggleUnit = () => setUnit(prev => prev === 'lbs' ? 'kg' : 'lbs');

  // Math: Database is assumed to store LBS natively.
  const toDisplay = (dbWeightLbs: number) => {
    if (!dbWeightLbs || dbWeightLbs === 0) return '';
    if (unit === 'kg') return Math.round((dbWeightLbs * 0.453592) * 2) / 2; // Rounds to nearest 0.5 kg
    return Math.round(dbWeightLbs);
  };

  const toDB = (displayWeight: number) => {
    if (!displayWeight || displayWeight === 0) return 0;
    if (unit === 'kg') return displayWeight * 2.20462;
    return displayWeight;
  };

  const displayWeight = (dbWeightLbs: number) => {
     if (!dbWeightLbs || dbWeightLbs === 0) return 'Bodyweight';
     return `${toDisplay(dbWeightLbs)} ${unit}`;
  };

  return (
    <UnitContext.Provider value={{ unit, toggleUnit, displayWeight, toDisplay, toDB }}>
      {children}
    </UnitContext.Provider>
  );
};

export const useUnit = () => {
  const context = useContext(UnitContext);
  if (!context) throw new Error("useUnit must be used within UnitProvider");
  return context;
};