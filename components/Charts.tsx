import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Expense, CategoryData, DailyData } from '../types';
import { CATEGORIES } from '../constants';

type ToTWD = (amount: number, currency: string) => number;

interface ChartsProps {
  expenses: Expense[];
  toTWD: ToTWD;
}

export const ExpensePieChart: React.FC<ChartsProps> = ({ expenses, toTWD }) => {
  const data: CategoryData[] = React.useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(e => {
      const current = map.get(e.category) || 0;
      map.set(e.category, current + toTWD(e.amount, e.currency));
    });

    return Array.from(map.entries()).map(([key, value]) => {
      const cat = CATEGORIES.find(c => c.id === key);
      return {
        name: cat ? cat.name : key,
        value: value,
        color: cat ? cat.color : '#cccccc',
      };
    }).filter(item => item.value > 0);
  }, [expenses, toTWD]);

  if (data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">無資料</div>;
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`NT$ ${value.toLocaleString()}`, '']}
            contentStyle={{ 
              backgroundColor: '#fff', 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
              fontWeight: 500
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle" 
            iconSize={8}
            formatter={(value) => <span className="text-xs text-slate-500 ml-1">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ExpenseLineChart: React.FC<ChartsProps> = ({ expenses, toTWD }) => {
  const data: DailyData[] = React.useMemo(() => {
    const map = new Map<string, number>();
    
    const sorted = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach(e => {
      const current = map.get(e.date) || 0;
      map.set(e.date, current + toTWD(e.amount, e.currency));
    });

    return Array.from(map.entries()).map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
      amount,
    }));
  }, [expenses, toTWD]);

  if (data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">無歷史紀錄</div>;
  }

  return (
    <div className="w-full h-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#94a3b8' }} 
            dy={10}
            interval="preserveStartEnd"
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              fontSize: '12px'
            }}
            cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
            formatter={(value: number) => [`NT$ ${value.toLocaleString()}`, '花費']}
          />
          <Line 
            type="monotone" 
            dataKey="amount" 
            stroke="#6366f1" 
            strokeWidth={2.5} 
            dot={{ fill: '#6366f1', r: 3, strokeWidth: 2, stroke: '#fff' }} 
            activeDot={{ r: 5, strokeWidth: 0 }} 
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
