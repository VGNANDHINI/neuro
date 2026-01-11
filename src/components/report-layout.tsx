'use client';
import type { AppUser, TestResult } from '@/lib/types';
import { format } from 'date-fns';

interface ReportLayoutProps {
  user: AppUser;
  test: TestResult;
  chartData: { subject: string; value: number; fullMark: number }[];
  scoreCards: { label: string; value: number | string | undefined }[];
}

export function ReportLayout({ user, test, scoreCards }: ReportLayoutProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low':
        return '#10B981'; // Green
      case 'Moderate':
        return '#F59E0B'; // Amber
      case 'High':
        return '#EF4444'; // Red
      default:
        return '#000000'; // Black
    }
  };

  const testCategoryMap: Record<string, string> = {
      spiral: 'Neurological Motor Assessment (Spiral)',
      voice: 'Vocal Biomarker Analysis (Voice)',
      tapping: 'Motor Function Assessment (Tapping)',
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#000', backgroundColor: '#fff', fontSize: '11pt', lineHeight: '1.4', paddingBottom: '1in' }}>
      {/* 1. HEADER */}
      <header style={{ textAlign: 'center', borderBottom: '2px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: '0' }}>NEUROVITA</h1>
        <p style={{ fontSize: '10pt', margin: '5px 0 0 0' }}>123 Health Lane, Wellness City, 12345 | (555) 123-4567 | contact@neurovita.health</p>
      </header>

      <main>
        {/* 2. REPORT TITLE */}
        <h2 style={{ textAlign: 'center', fontSize: '16pt', fontWeight: 'bold', margin: '20px 0' }}>
          NEUROLOGICAL ASSESSMENT REPORT
        </h2>

        {/* 3. PATIENT INFORMATION */}
        <section style={{ marginBottom: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 20px' }}>
            <p><strong style={{ minWidth: '120px', display: 'inline-block' }}>Patient Name:</strong> {user.name}</p>
            <p><strong style={{ minWidth: '120px', display: 'inline-block' }}>Age / Gender:</strong> {user.age || 'N/A'} / {user.gender || 'N/A'}</p>
            <p><strong style={{ minWidth: '120px', display: 'inline-block' }}>Patient Email:</strong> {user.email}</p>
            <p><strong style={{ minWidth: '120px', display: 'inline-block' }}>Report Date:</strong> {format(new Date(), 'dd-MM-yyyy')}</p>
          </div>
        </section>

        {/* 4. TEST DETAILS */}
         <section style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '10px' }}>TEST DETAILS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 20px' }}>
                 <p><strong style={{ minWidth: '120px', display: 'inline-block' }}>Test Name:</strong> <span style={{textTransform: 'capitalize'}}>{test.testType} Test</span></p>
                 <p><strong style={{ minWidth: '120px', display: 'inline-block' }}>Test Category:</strong> {testCategoryMap[test.testType]}</p>
                 <p><strong style={{ minWidth: '120px', display: 'inline-block' }}>Test Date:</strong> {format(new Date(test.createdAt), 'dd-MM-yyyy, h:mm a')}</p>
            </div>
        </section>

        {/* 5. OBSERVATIONS / MEASURED VALUES */}
        <section style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '10px' }}>OBSERVATIONS</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Parameter</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Observed Value</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Normal Range</th>
                    </tr>
                </thead>
                <tbody>
                    {scoreCards.map(metric => (
                        <tr key={metric.label}>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{metric.label}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{metric.value}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>75-100</td>
                        </tr>
                    ))}
                    <tr>
                       <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>Overall Score</td>
                       <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{test.overallScore.toFixed(1)}</td>
                       <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>75-100</td>
                    </tr>
                </tbody>
            </table>
        </section>

        {/* 6. INTERPRETATION */}
        <section style={{ marginBottom: '30px' }}>
             <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '10px' }}>INTERPRETATION</h3>
             <p>This automated analysis is based on established biomarkers identified in clinical research. Scores are generated by comparing performance against normative data. Deviations from the normal range in parameters such as speed, smoothness, and consistency may indicate potential underlying neuromotor impairments. The overall score provides a summary of performance across all measured domains.</p>
        </section>

        {/* 7. RISK LEVEL */}
        <section style={{ marginBottom: '30px' }}>
            <div style={{ border: '1px solid #ccc', padding: '10px' }}>
                 <span style={{fontWeight: 'bold'}}>RISK LEVEL: </span>
                 <span style={{ fontWeight: 'bold', color: getRiskColor(test.riskLevel) }}>
                    {test.riskLevel.toUpperCase()}
                 </span>
            </div>
        </section>

        {/* 8. RECOMMENDATIONS */}
        <section style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '10px' }}>AI-GENERATED RECOMMENDATIONS</h3>
            <p>{test.recommendation}</p>
        </section>

        {/* 9. AUTHORIZATION */}
        <section style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
            <div style={{ float: 'right', textAlign: 'center' }}>
                <div style={{height: '60px'}}>{/* Space for signature */}</div>
                <p style={{ borderTop: '1px solid #000', paddingTop: '5px', margin: '0' }}>Automated Report Generation</p>
                <p style={{ margin: '0' }}>NeuroVita Platform</p>
            </div>
             <div style={{clear: 'both'}}></div>
        </section>
      </main>

      {/* 10. FOOTER */}
      <footer className="report-footer" style={{ textAlign: 'center', borderTop: '1px solid #ccc', paddingTop: '10px', fontSize: '9pt', color: '#666' }}>
        <p style={{ margin: '0' }}>Confidential Medical Document – For authorized use only.</p>
        <p style={{ margin: '5px 0' }}>
            Disclaimer: NeuroVita is not a medical device and should not be used for diagnosis. This report is for informational purposes only. Always consult with a qualified healthcare professional.
        </p>
      </footer>
    </div>
  );
}
