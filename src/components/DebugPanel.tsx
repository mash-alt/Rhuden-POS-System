import React, { useState } from 'react';
import { createTestCreditPayment, createTestSalePayment } from '../test/createTestTransaction';

/**
 * Debug panel component that provides test buttons for payment types
 */
const DebugPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateCreditPayment = async () => {
    try {
      setStatus('Creating test credit payment...');
      const id = await createTestCreditPayment();
      setStatus(`Created test credit payment with ID: ${id}`);
      setError(null);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setStatus(null);
    }
  };

  const handleCreateSalePayment = async () => {
    try {
      setStatus('Creating test sale payment...');
      const id = await createTestSalePayment();
      setStatus(`Created test sale payment with ID: ${id}`);
      setError(null);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setStatus(null);
    }
  };
  
  if (!isExpanded) {
    return (
      <div 
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          padding: '10px',
          background: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '5px',
          cursor: 'pointer',
          zIndex: 1000
        }}
        onClick={() => setIsExpanded(true)}
      >
        🛠️ Debug Panel
      </div>
    );
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        padding: '15px',
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: '5px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
        width: '300px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>Debug Panel</h3>
        <button 
          style={{ 
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
          onClick={() => setIsExpanded(false)}
        >
          ✖️
        </button>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <h4>Test Payment Types</h4>
        <button 
          style={{ 
            marginRight: '10px',
            padding: '5px 10px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={handleCreateCreditPayment}
        >
          Create Credit Payment
        </button>
        <button 
          style={{ 
            padding: '5px 10px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={handleCreateSalePayment}
        >
          Create Sale Payment
        </button>
      </div>
      
      {status && (
        <div style={{ marginTop: '10px', padding: '10px', background: '#e8f5e9', borderRadius: '4px' }}>
          {status}
        </div>
      )}
      
      {error && (
        <div style={{ marginTop: '10px', padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
