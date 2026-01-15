import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useCalendar } from '../context/CalendarContext';
import { getSubjectColor } from '../utils/colorUtils';

interface AnalyticsProps {
  onClose: () => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ onClose }) => {
  const { events } = useCalendar();

  const data = useMemo(() => {
    const subjectHours: Record<string, number> = {};

    events.forEach(event => {
      const durationMs = event.end.getTime() - event.start.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      const subject = event.summary || 'Unknown';
      
      if (!subjectHours[subject]) {
        subjectHours[subject] = 0;
      }
      subjectHours[subject] += durationHours;
    });

    return Object.keys(subjectHours).map(subject => ({
      name: subject,
      hours: parseFloat(subjectHours[subject].toFixed(1)),
      color: getSubjectColor(subject)
    })).sort((a, b) => b.hours - a.hours);
  }, [events]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-800">Course Workload Analytics</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          <p className="text-gray-600 mb-4">Total contact hours distribution by subject (Current Calendar).</p>
          
          {data.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              No data available. Import a calendar first.
            </div>
          ) : (
            <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={150} tick={{fontSize: 12}} interval={0} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                    cursor={{fill: '#f3f4f6'}}
                  />
                  <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;