import React from 'react';
import { Card, Space } from 'antd';
import PropTypes from 'prop-types';

const PriceMovementChart = ({ movements }) => {
  const chunkSize = 5; // Number of movements per row
  const movementGroups = [];
  for (let i = 0; i < movements.length; i += chunkSize) {
    movementGroups.push(movements.slice(i, i + chunkSize));
  }

  return (
    <Card size="small" title="Recent Price Movements">
      <Space direction="vertical" style={{ width: '100%' }}>
        {movementGroups.map((group, groupIndex) => (
          <div key={groupIndex} style={{ display: 'flex', justifyContent: 'center' }}>
            {group.map((movement, index) => (
              <div
                key={`${groupIndex}-${index}`}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: movement === 'up' ? '#52c41a' : '#f5222d',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: 4,
                  fontWeight: 'bold',
                }}
              >
                {movement === 'up' ? '↑' : '↓'}
              </div>
            ))}
          </div>
        ))}
      </Space>
    </Card>
  );
};

PriceMovementChart.propTypes = {
  movements: PropTypes.arrayOf(PropTypes.oneOf(['up', 'down'])).isRequired,
};

export default PriceMovementChart;