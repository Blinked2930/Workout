import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/database';
import type { Lift } from '../types/database';
import { format } from 'date-fns';

interface LiftHistoryProps {
  exerciseId: string;
}

export function LiftHistory({ exerciseId }: LiftHistoryProps) {
  const lifts = useLiveQuery(
    () => db.lifts
      .where('exerciseId')
      .equals(exerciseId)
      .toArray(),
    [exerciseId]
  );

  if (!lifts || lifts.length === 0) {
    return (
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p>No lifts recorded yet.</p>
      </div>
    );
  }

  // Group lifts by date
  const liftsByDate = lifts.reduce((acc, lift) => {
    const date = format(new Date(lift.date), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(lift);
    return acc;
  }, {} as Record<string, Lift[]>);

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {Object.entries(liftsByDate).map(([date, dateLifts]) => (
        <div key={date} style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {format(new Date(date), 'MMMM d, yyyy')}
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem', fontWeight: 'bold' }}>Weight (kg)</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', fontWeight: 'bold' }}>Reps</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', fontWeight: 'bold' }}>Volume</th>
                </tr>
              </thead>
              <tbody>
                {dateLifts.map((lift) => (
                  <tr key={lift.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      {lift.weight} kg{lift.isEachSide ? ' (Each Side)' : ''}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{lift.reps}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      {(lift.weight * lift.reps).toFixed(1)} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
